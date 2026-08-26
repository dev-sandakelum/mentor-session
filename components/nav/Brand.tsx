import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="ICTSC Mentor Session — Home">
      <div className="logo" aria-hidden="true">
        SC
      </div>
      <div>
        ICTSC Mentor Session
        <small>Faculty of Technology · University of Ruhuna</small>
      </div>
    </Link>
  );
}
