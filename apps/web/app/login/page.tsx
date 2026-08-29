import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "72px 24px" }}>
      <p className="eyebrow">IdeaBin.ai</p>
      <h1 style={{ fontSize: "2.5rem" }}>Sign in</h1>
      <p>Private V1 access. Accounts are provisioned by the project owner.</p>

      {error ? (
        <p role="alert" style={{ color: "#991b1b" }}>
          Sign-in failed. Check your email and password.
        </p>
      ) : null}

      <form action={login} style={{ display: "grid", gap: 16, marginTop: 32 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            style={{ padding: 12, font: "inherit" }}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={{ padding: 12, font: "inherit" }}
          />
        </label>

        <button type="submit" style={{ padding: 12, font: "inherit", fontWeight: 700 }}>
          Sign in
        </button>
      </form>
    </main>
  );
}
