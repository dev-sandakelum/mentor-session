import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Mentor Session — Home">
      <Image
        src="/logo2.png"
        alt="ICT Students' Circle logo"
        width={36}
        height={36}
        className="logo"
        priority
      />
      <div>
        Mentor Session
        <small>Faculty of Technology · University of Ruhuna</small>
      </div>
    </Link>
  );
}
