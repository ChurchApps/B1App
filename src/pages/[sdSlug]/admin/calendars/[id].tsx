import { useEffect, useState } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
import { ConfigHelper, ApiHelper, WrapperPageProps, CuratedCalendarInterface } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";

export default function CalendarPage(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [currentCalendar, setCurrentCalendar] = useState<CuratedCalendarInterface>(null);
  const router = useRouter();
  const curatedCalendarId = router.query?.id;

  const loadData = () => {
    if (!isAuthenticated) router.push("/login");
    ApiHelper.get("/curatedCalendars/" + curatedCalendarId, "ContentApi").then((data) => setCurrentCalendar(data));
  };

  useEffect(() => { loadData(); }, []);

  return (
    <AdminWrapper config={props.config}>
      <h1>{currentCalendar?.name}</h1>
    </AdminWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths: any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
