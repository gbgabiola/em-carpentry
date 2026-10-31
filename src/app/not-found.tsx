import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-stack">
      <div className="page-intro">
        <p className="eyebrow">404</p>
        <h1>Page not found.</h1>
        <p className="intro-copy">
          This page may have moved or may not be available yet.
        </p>
      </div>
      <Link className="button button-primary" href="/">
        Back to Home
      </Link>
    </div>
  );
}
