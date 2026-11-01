import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

let db;
const owner = "11111111-1111-4111-8111-111111111111";
const outsider = "22222222-2222-4222-8222-222222222222";
const published = "33333333-3333-4333-8333-333333333333";
const draft = "44444444-4444-4444-8444-444444444444";
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated; grant select,insert,update,delete on storage.objects to anon,authenticated;
 insert into auth.users values ('${owner}'),('${outsider}');`);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/20261101110949_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query("insert into private.admin_users values ($1)", [owner]);
  await db.query(
    "insert into projects(id,slug,title,summary,description,status) values ($1,'published','Published','Summary','Description','published'),($2,'draft','Secret draft','Summary','Description','draft')",
    [published, draft],
  );
  for (const project of [published, draft]) {
    const imageId =
      project === published
        ? "55555555-5555-4555-8555-555555555555"
        : "66666666-6666-4666-8666-666666666666";
    const path = `${project}/77777777-7777-4777-8777-777777777777.webp`;
    await db.query(
      "insert into project_images(id,project_id,path,alt) values($1,$2,$3,'Photo')",
      [imageId, project, path],
    );
    await db.query(
      "insert into storage.objects(bucket_id,name) values('project-images',$1)",
      [path],
    );
  }
  await db.exec(
    "insert into storage.objects(bucket_id,name) values('project-images','orphan.webp'); insert into reviews(display_name,rating,body,consent,status) values('Approved',5,'Feedback',true,'approved'),('Pending',4,'Private feedback',true,'pending'),('No consent',3,'Private feedback',false,'pending'); insert into enquiries(name,contact_method,contact_details,description) values('Private customer','email','private@example.test','Private customer request');",
  );
  const directory = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(directory))
    .filter(
      (file) =>
        file.endsWith(".sql") && file !== "20261101110949_foundation.sql",
    )
    .sort())
    await db.exec(await readFile(new URL(file, directory), "utf8"));
});
after(async () => {
  await db?.close();
});
async function asRole(role, uid, work) {
  assert.ok(["anon", "authenticated"].includes(role));
  await db.exec(`begin; set local role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
    uid || "",
  ]);
  try {
    return await work();
  } finally {
    await db.exec("rollback");
  }
}
const rows = async (sql, params = []) => (await db.query(sql, params)).rows;

test("anonymous and non-owner users cannot read drafts, private enquiries or pending reviews", async () => {
  for (const [role, uid] of [
    ["anon", null],
    ["authenticated", outsider],
  ])
    await asRole(role, uid, async () => {
      assert.equal((await rows("select * from projects")).length, 1);
      assert.equal((await rows("select * from project_images")).length, 1);
      assert.equal((await rows("select * from reviews")).length, 1);
      assert.equal((await rows("select * from business_settings")).length, 1);
      if (role === "authenticated")
        assert.equal((await rows("select * from enquiries")).length, 0);
      else
        await assert.rejects(
          rows("select * from enquiries"),
          /permission denied/,
        );
    });
});
test("owner membership is private and cannot be self-assigned", async () => {
  await asRole("authenticated", outsider, async () => {
    assert.equal(
      (await rows("select public.is_admin() as allowed"))[0].allowed,
      false,
    );
    await assert.rejects(
      rows("insert into private.admin_users values($1)", [outsider]),
      /permission denied/,
    );
  });
});
test("owner can inspect private records and non-owner cannot mutate content", async () => {
  await asRole("authenticated", owner, async () => {
    assert.equal(
      (await rows("select public.is_admin() as allowed"))[0].allowed,
      true,
    );
    assert.equal((await rows("select * from projects")).length, 2);
    assert.equal((await rows("select * from enquiries")).length, 1);
    assert.equal((await rows("select * from reviews")).length, 3);
  });
  await asRole("authenticated", outsider, async () => {
    assert.equal(
      (await rows("update projects set title='Attack' returning id")).length,
      0,
    );
    assert.equal((await rows("delete from reviews returning id")).length, 0);
    await assert.rejects(
      rows(
        "insert into projects(slug,title,summary,description) values('attack','Attack','Summary','Description')",
      ),
      /row-level security/,
    );
  });
});
test("all public submission paths remain denied at the database layer", async () => {
  for (const [role, uid] of [
    ["anon", null],
    ["authenticated", outsider],
  ]) {
    await asRole(role, uid, async () => {
      await assert.rejects(
        rows(
          "insert into enquiries(name,contact_method,contact_details,description) values('Attack','email','a@example.test','Unwanted message')",
        ),
        /permission denied/,
      );
    });
    await asRole(role, uid, async () => {
      await assert.rejects(
        rows(
          "insert into reviews(display_name,rating,body,consent) values('Attack',5,'Unwanted review',true)",
        ),
        /permission denied|row-level security/,
      );
    });
  }
});
test("publish and archive changes control visibility immediately", async () => {
  await asRole("authenticated", owner, async () => {
    await db.query("update projects set status='published' where id=$1", [
      draft,
    ]);
    await db.exec("set local role anon");
    await db.query("select set_config('request.jwt.claim.sub','',true)");
    assert.equal((await rows("select * from projects")).length, 2);
    await db.exec("set local role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      owner,
    ]);
    await db.query("update projects set status='archived' where id=$1", [
      published,
    ]);
    await db.exec("set local role anon");
    await db.query("select set_config('request.jwt.claim.sub','',true)");
    const visible = await rows("select * from projects");
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, draft);
    assert.equal((await rows("select * from project_images")).length, 1);
  });
});
test("only approved consented reviews become public", async () => {
  await asRole("authenticated", owner, async () => {
    await db.exec(
      "update reviews set status='approved' where display_name='Pending'; set local role anon; select set_config('request.jwt.claim.sub','',true);",
    );
    assert.equal((await rows("select * from reviews")).length, 2);
  });
  await asRole("authenticated", owner, async () => {
    await assert.rejects(
      rows(
        "update reviews set status='approved' where display_name='No consent'",
      ),
      /check constraint/,
    );
  });
});
test("storage hides drafts and orphans, owner alone can upload or delete", async () => {
  await asRole("anon", null, async () => {
    assert.equal((await rows("select * from storage.objects")).length, 1);
  });
  await asRole("authenticated", owner, async () => {
    assert.equal((await rows("select * from storage.objects")).length, 3);
    await rows(
      "insert into storage.objects(bucket_id,name) values('project-images','owner.webp')",
    );
    assert.equal(
      (await rows("delete from storage.objects returning id")).length,
      4,
    );
  });
  await asRole("authenticated", outsider, async () => {
    assert.equal(
      (await rows("delete from storage.objects returning id")).length,
      0,
    );
    await assert.rejects(
      rows(
        "insert into storage.objects(bucket_id,name) values('project-images','attack.webp')",
      ),
      /row-level security/,
    );
  });
});
test("Facebook testimonials require attribution and do not need an invented rating", async () => {
  await asRole("authenticated", owner, async () => {
    await rows(
      "insert into reviews(display_name,body,source,source_url,consent,status) values('Reviewer','Genuine feedback','facebook','https://www.facebook.com/EMscarpentryworks',true,'approved')",
    );
    await db.exec("set local role anon");
    await db.query("select set_config('request.jwt.claim.sub','',true)");
    const result = await rows(
      "select rating from reviews where source='facebook'",
    );
    assert.equal(result[0].rating, null);
  });
  await asRole("authenticated", owner, async () => {
    await assert.rejects(
      rows(
        "insert into reviews(display_name,body,source,consent) values('Reviewer','Text','facebook',true)",
      ),
      /check constraint|not-null/,
    );
  });
});

async function become(role, uid) {
  assert.ok(["anon", "authenticated"].includes(role));
  await db.exec(`set local role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
    uid || "",
  ]);
}
test("new owner-content migration preserves existing data and keeps initial FAQs as private drafts", async () => {
  await asRole("authenticated", owner, async () => {
    assert.equal(
      (await rows("select title from projects where id=$1", [published]))[0]
        .title,
      "Published",
    );
    assert.equal((await rows("select * from enquiries")).length, 1);
    assert.equal((await rows("select * from faqs")).length, 4);
    assert.ok(
      (await rows("select * from projects")).every(
        (project) => project.comparison_enabled === false,
      ),
    );
  });
  for (const [role, uid] of [
    ["anon", null],
    ["authenticated", outsider],
  ])
    await asRole(role, uid, async () => {
      assert.equal((await rows("select * from services")).length, 0);
      assert.equal((await rows("select * from faqs")).length, 0);
    });
});
test("unconfirmed services and FAQs cannot be published even through direct database writes", async () => {
  await asRole("authenticated", owner, async () => {
    await assert.rejects(
      rows(
        "insert into services(name,slug,description,status) values('Fixture service','fixture','Description','published')",
      ),
      /check constraint/,
    );
  });
  await asRole("authenticated", owner, async () => {
    await assert.rejects(
      rows("update faqs set status='published'"),
      /check constraint/,
    );
  });
});
test("service publication and archiving update visitor visibility", async () => {
  await asRole("authenticated", owner, async () => {
    await rows(
      "insert into services(name,slug,description,publication_confirmed) values('Fixture service','fixture','Description',true)",
    );
    await become("anon", null);
    assert.equal((await rows("select * from services")).length, 0);
    await become("authenticated", owner);
    await rows("update services set status='published' where slug='fixture'");
    await become("anon", null);
    assert.equal((await rows("select * from services")).length, 1);
    await become("authenticated", owner);
    await rows("update services set status='archived' where slug='fixture'");
    await become("anon", null);
    assert.equal((await rows("select * from services")).length, 0);
  });
});
test("FAQ publication and unpublishing respect approval and owner-only access", async () => {
  await asRole("authenticated", owner, async () => {
    await rows(
      "update faqs set status='published',publication_confirmed=true where display_order=0",
    );
    await become("authenticated", outsider);
    assert.equal((await rows("select * from faqs")).length, 1);
    assert.equal(
      (await rows("update faqs set answer='Attack' returning id")).length,
      0,
    );
    await become("authenticated", owner);
    await rows("update faqs set status='draft' where display_order=0");
    await become("anon", null);
    assert.equal((await rows("select * from faqs")).length, 0);
  });
  for (const [role, uid] of [
    ["anon", null],
    ["authenticated", outsider],
  ])
    await asRole(role, uid, async () => {
      await assert.rejects(
        rows(
          "insert into services(name,slug,description) values('Attack','attack','Text')",
        ),
        /permission denied|row-level security/,
      );
    });
});
test("business contact updates require owner access and database format checks", async () => {
  await asRole("authenticated", outsider, async () => {
    assert.equal(
      (
        await rows(
          "update business_settings set email='attack@example.test' returning id",
        )
      ).length,
      0,
    );
  });
  await asRole("authenticated", owner, async () => {
    await rows("update business_settings set email='owner@example.test'");
    await become("anon", null);
    assert.equal(
      (await rows("select email from business_settings"))[0].email,
      "owner@example.test",
    );
  });
  for (const update of [
    "phone='123'",
    "facebook_url='https://evil.test'",
    "email='not an email'",
  ])
    await asRole("authenticated", owner, async () => {
      await assert.rejects(
        rows(`update business_settings set ${update}`),
        /check constraint/,
      );
    });
});

test("owner lookup keeps privileged code private and membership protected by RLS", async () => {
  const functions = await rows(
    "select n.nspname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='is_admin' and n.nspname in ('public','private')",
  );
  assert.equal(
    functions.find((fn) => fn.nspname === "public").prosecdef,
    false,
  );
  assert.equal(
    functions.find((fn) => fn.nspname === "private").prosecdef,
    true,
  );
  assert.equal(
    (
      await rows(
        "select relrowsecurity from pg_class where oid='private.admin_users'::regclass",
      )
    )[0].relrowsecurity,
    true,
  );
  await asRole("anon", null, async () => {
    assert.equal(
      (await rows("select public.is_admin() as allowed"))[0].allowed,
      false,
    );
    await assert.rejects(
      rows("select * from private.admin_users"),
      /permission denied/,
    );
  });
});

test("authenticated readers use one select policy per public content table", async () => {
  const policies = await rows(
    "select tablename,count(*)::int as count from pg_policies where schemaname='public' and tablename in ('projects','project_images','reviews','services','faqs') and 'authenticated'=any(roles) and cmd in ('SELECT','ALL') group by tablename",
  );
  assert.equal(policies.length, 5);
  assert.ok(policies.every((policy) => policy.count === 1));
});
