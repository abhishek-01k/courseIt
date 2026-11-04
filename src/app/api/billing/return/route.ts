import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { syncSubscription } from "@/lib/billing";

// Dodo sends the learner here after paying, with ?subscription_id=…. Saving it now means Settings shows the
// new plan at once instead of waiting for the webhook (which still arrives and changes nothing).
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const subscriptionId = request.nextUrl.searchParams.get("subscription_id");
  if (subscriptionId) {
    try {
      await syncSubscription(subscriptionId, userId);
    } catch (error) {
      console.error(error); // the webhook will catch up
    }
  }
  redirect("/settings?upgraded=1");
}
