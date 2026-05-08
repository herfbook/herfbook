import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-serif text-6xl font-bold text-primary">HerfBook</h1>
      <p className="text-4xl font-semibold">404</p>
      <p className="text-muted-foreground">Page not found.</p>
      <Link
        to="/"
        className="text-sm underline underline-offset-4 hover:text-primary"
      >
        Back to home
      </Link>
    </div>
  );
}
