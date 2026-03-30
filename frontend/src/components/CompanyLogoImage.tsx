import { useEffect, useState } from "react";
import { fetchCompanyLogoDisplayUrl } from "../lib/imageUpload";
import { CompanyLogoPlaceholder } from "./CompanyLogoPlaceholder";

type Props = {
  s3Key?: string | null;
  className?: string;
  alt?: string;
};

export function CompanyLogoImage({ s3Key, className = "w-12 h-12", alt = "" }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const key = s3Key?.trim();
    if (!key) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await fetchCompanyLogoDisplayUrl(key);
        if (!cancelled) setUrl(u);
      } catch {
        if (!cancelled) setUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [s3Key]);

  if (url) {
    return (
      <div className={`${className} rounded-xl overflow-hidden shrink-0 bg-gray-100`}>
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }
  return <CompanyLogoPlaceholder className={className} />;
}
