export const TOAST_MESSAGES = {
  auth: {
    requestOtp: {
      loading: "Sending OTP...",
      success: "OTP sent successfully",
      error: "Failed to send OTP"
    },
    verifyOtp: {
      loading: "Verifying OTP...",
      success: "Signed in successfully",
      error: "OTP verification failed"
    }
  },
  committee: {
    create: {
      loading: "Creating committee...",
      success: "Committee created successfully",
      error: "Could not create committee"
    },
    join: {
      loading: "Joining committee...",
      success: "Joined committee successfully",
      error: "Could not join committee"
    },
    assignPayout: {
      loading: "Assigning payout...",
      success: "Payout assigned successfully",
      error: "Failed to assign payout"
    },
    payoutOrder: {
      loading: "Saving payout order...",
      success: "Payout order updated",
      error: "Failed to save payout order"
    },
    loadDetailsError: "Failed to load committee details"
  },
  dashboard: {
    loadError: "Failed to load dashboard"
  }
} as const;
