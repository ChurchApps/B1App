import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ConfigHelper, PageInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper, DisplayBox, ErrorMessages, LinkInterface, SmallButton } from "@churchapps/apphelper";
import { Grid, TableCell, TableRow } from "@mui/material";
import { useWindowWidth } from "@react-hook/window-size";
import { SiteNavigation } from "@/components/admin/SiteNavigation";
import { NavItemEdit } from "@/components/admin/site/NavItemEdit";
import { AdminSiteWrapper } from "@/components/admin/AdminSiteWrapper";

export default function Admin(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [links, setLinks] = useState<LinkInterface[]>([]);
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const windowWidth = useWindowWidth();

  const loadData = () => {
    if (!isAuthenticated) return;

    ApiHelper.get("/pages", "ContentApi").then((_pages) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach((p:PageInterface) => {
        if (!p.url.startsWith("/stream/") && !p.url.startsWith("/member/")) filteredPages.push(p);
      });
      setPages(filteredPages || [])
    });

    ApiHelper.get("/links?category=website", "ContentApi").then(data => { setLinks(data); });
  };

  useEffect(() => { if (!isAuthenticated) router.push("/login"); }, []);
  useEffect(loadData, [isAuthenticated]);

  const navigationHandler = (errorMessage: string, url: string) => {
    let errors: string[] = [];

    if (windowWidth > 882){
      router.push(url);
    } else {
      errors.push(errorMessage);
    }

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }
  }

  const getUnlinkedPages = () => {
    const unlinkedPages = pages.filter(p => !links.find(l => l.url === p.url));
    const result = unlinkedPages.map((page) => {

      const clickHandler = () => navigationHandler("Page editor is only accessible on desktop", "/admin/site/pages/" + page.id);

      return (
        <TableRow key={page.id}>
          <TableCell>
            <a onClick={clickHandler} style={{cursor: "pointer"}}>{page.url}</a>
          </TableCell>
          <TableCell>
            <a onClick={clickHandler} style={{cursor: "pointer"}}>{page.title}</a>
          </TableCell>
          <TableCell align="right">
            <SmallButton
              icon="edit"
              onClick={() => {
                //setEditPage(page);
              }}
            />
          </TableCell>
        </TableRow>
      )
    });
    return result;
  }


  //<YourSiteSettings />

  return (
    <AdminSiteWrapper config={props.config}>
      <h1>Pages</h1>
      <ErrorMessages errors={errors} />
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <SiteNavigation links={links} pages={pages} refresh={loadData} select={(link, page) => {}} />
          <DisplayBox headerIcon="link" headerText="Not Linked">
            <table className="table">
              {getUnlinkedPages() }
            </table>
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          <NavItemEdit updatedFunction={loadData} link={undefined} page={undefined} links={links} />
        </Grid>
      </Grid>

    </AdminSiteWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
