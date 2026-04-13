export function BrandLogo({
  compact = false,
  href,
  className = "",
  imageClassName = "",
  src = "/logo-pacto-agil-new.png",
}: {
  compact?: boolean;
  href?: string;
  className?: string;
  imageClassName?: string;
  src?: string;
}) {
  const content = (
    <span className={`inline-flex items-center ${className}`.trim()}>
      <img
        src={src || "/logo-pacto-agil-new.png"}
        alt="Pacto Agil"
        width={compact ? 42 : 200}
        height={compact ? 42 : 56}
        className={`object-contain transition-all duration-500 ${imageClassName}`.trim()}
        style={{ height: "auto" }}
      />
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} className="hover-lift">
      {content}
    </a>
  );
}

