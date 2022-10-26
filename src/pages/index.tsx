import { GetStaticProps } from "next";
import { Layout } from "@/components";
import { Section } from "@/components/Section";
import { Container } from "@mui/material";
import pageData from "../samplePages/newhere.json";

type Props = {
  pageData: any;
};

export default function Home(props: Props) {

  let description = "Church budgets prohibit teaching the word of God in the most effective way possible. We provide high quality content to churches completely free of charge, thanks to our generous partners."
  let ogDescription = "We provide high quality content to churches completely free of charge, thanks to our generous partners."
  let pageImage = "https://lessons.church/images/og-image.png";


  const getSections = () => {
    const result: JSX.Element[] = []
    props.pageData.sections.forEach(section => {
      result.push(<Section section={section} />)
    });
    return result;
  }

  return (
    <Layout metaDescription={description} image={pageImage} ogDescription={ogDescription}>
      <div className="pageHeader" style={{ backgroundImage: "url('" + props.pageData.headerImage + "')" }}>
        <Container style={{ position: "relative", paddingTop: 40, paddingBottom: 40 }}>
          <h1 style={{ textAlign: "center" }}>{props.pageData.title}</h1>
        </Container>
      </div>
      {getSections()}
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {

  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/about.json").then(resp => resp.json());
  //const pageData: PageInterface = await fetch("http://localhost:3000/samplePages/newhere.json").then(resp => resp.json());

  return {
    props: { pageData },
    revalidate: 30,
  };
};
