import { redirect } from "next/navigation";

type Params = Promise<{ sdSlug: string }>;

export default async function My({ params }: { params: Params }) {
  redirect(`/my/timeline`);
}
