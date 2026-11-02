// Approved website-copy policy. SQL migrations enforce these elapsed-day periods.
// Public intake remains disabled; downloaded backup rotation is manual.
export const retention = {
  closedEnquiryDays: 90,
  unpublishedReviewDays: 30,
  backupDays: 30,
} as const;
