import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildQueryString(searchParams: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (typeof value === "string") query.set(key, value);
  });

  const result = query.toString();
  return result ? `?${result}` : "";
}

export default async function MobileRoot({ searchParams }: { searchParams: SearchParams }) {
  const queryString = buildQueryString(await searchParams);
  redirect(`/mobile/dashboard${queryString}`);
}
