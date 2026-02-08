import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "USER";
      status: "ACTIVE" | "SUSPENDED";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: "OWNER" | "USER";
    status: "ACTIVE" | "SUSPENDED";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "OWNER" | "USER";
    status?: "ACTIVE" | "SUSPENDED";
  }
}
