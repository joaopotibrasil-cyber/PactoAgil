import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  compact = false,
  href,
  className = "",
  imageClassName = "",
}: {
  compact?: boolean;
  href?: string;
  className?: string;
  imageClassName?: string;
}) {
  const content = (
    <span className={`inline-flex items-center ${className}`.trim()}>
      <Image
        src="/logo-pacto-agil-new.png"
        alt="Pacto Agil"
        width={compact ? 42 : 200}
        height={compact ? 42 : 56}
        priority
        className={`object-contain transition-all duration-500 ${imageClassName}`.trim()}
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
