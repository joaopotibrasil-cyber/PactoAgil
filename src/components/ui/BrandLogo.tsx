import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  compact = false,
  href,
  className = "",
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  const content = (
    <span className={`inline-flex items-center overflow-hidden ${compact ? 'rounded-xl' : 'rounded-2xl'} ${className}`.trim()}>
      <Image
        src="/logo-pacto-agil-striking.png"
        alt="Pacto Agil"
        width={compact ? 42 : 200}
        height={compact ? 42 : 56}
        priority
        className="object-cover"
        style={{ width: "auto", height: "auto" }}
      />
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="hover-lift">
      {content}
    </Link>
  );
}
