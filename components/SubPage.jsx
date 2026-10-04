import Link from "next/link";
import "./subpage.css";

export default function SubPage({ title, children }) {
  return (
    <main className="sub">
      <Link className="back" href="/">← BACK</Link>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
