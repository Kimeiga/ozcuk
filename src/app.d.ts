/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
      } | null;
      session: {
        id: string;
        expiresAt: Date;
      } | null;
    }
    interface PageData {
      user?: App.Locals['user'];
    }
    interface PageState {}
    interface Platform {
      env?: {
        DB?: D1Database;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
        AUTH_SECRET?: string;
      };
    }
  }
}

export {};

