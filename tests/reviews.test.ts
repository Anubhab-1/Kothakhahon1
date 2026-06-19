import { test, describe } from "node:test";
import assert from "node:assert";
import { createBookReviewAction, moderateReviewAction } from "../app/reviews/actions";

describe("Reviews Actions Guards", () => {
  test("createBookReviewAction invokes session authentication check", async () => {
    const formData = new FormData();
    formData.append("bookId", "test-id");
    formData.append("bookSlug", "test-slug");
    formData.append("rating", "5");

    // Outside of the active request context, next/headers cookies() will throw or return null leading to redirect
    await assert.rejects(
      async () => {
        await createBookReviewAction(formData);
      },
      (err: any) => {
        return err instanceof Error && (err.message.includes("outside a request scope") || err.message.includes("NEXT_REDIRECT"));
      }
    );
  });

  test("moderateReviewAction invokes admin session authorization check", async () => {
    const formData = new FormData();
    formData.append("reviewId", "test-id");
    formData.append("action", "approve");

    // Outside of the active request context, next/headers cookies() will throw or return null leading to redirect
    await assert.rejects(
      async () => {
        await moderateReviewAction(formData);
      },
      (err: any) => {
        return err instanceof Error && (err.message.includes("outside a request scope") || err.message.includes("NEXT_REDIRECT"));
      }
    );
  });
});
