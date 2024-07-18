import { useState, useEffect } from "react";
import { ErrorMessages, InputBox, UserHelper, Permissions, LinkInterface, SlugHelper, ApiHelper } from "@churchapps/apphelper";
import { TemplateHelper } from "@/helpers/TemplateHelper";
import { PageInterface } from "@/helpers";
import { Button, Dialog, Grid, Icon, InputLabel, SelectChangeEvent, TextField } from "@mui/material";

type Props = {
  mode: string,
  updatedCallback: (page: PageInterface, link: LinkInterface) => void;
  onDone: () => void;
};

export function AddPageModal(props: Props) {
  const [page, setPage] = useState<PageInterface>(null);
  const [link, setLink] = useState<LinkInterface>(null);
  const [errors, setErrors] = useState([]);
  const [pageTemplate, setPageTemplate] = useState<string>("blank");

  const handleCancel = () => props.updatedCallback(null, null);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...page };
    const val = e.target.value;
    switch (e.target.name) {
      case "title": p.title = val; break;
      case "url":
        p.url = val.toLowerCase();
        if (link) {
          let l = { ...link };
          l.url = val.toLowerCase();
          setLink(l);
        }
        break;
      case "layout": p.layout = val; break;
    }
    setPage(p);
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let l = { ...link };
    const val = e.target.value;
    switch (e.target.name) {
      case "linkText": l.text = val; break;
      case "linkUrl": l.url = val; break;
    }
    setLink(l);
  };

  const validate = () => {
    let errors = [];
    if (pageTemplate === "link") {
      if (!link.url || link.url === "") errors.push("Please enter a url.");
    } else {
      if (!page.title || page.title === "") errors.push("Please enter a title.");
    }
    if (props.mode==="navigation") {
      if (!link.text || link.text === "") errors.push("Please enter link text.");
    }
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create pages");
    setErrors(errors);
    return errors.length === 0;
  };

  const createTemplate = async(type: string, pageId: string) => {
    switch (type) {
      case "blank": ; break;
      case "sermons": await TemplateHelper.createSermonsPage(pageId); break;
      case "about": await TemplateHelper.createAboutUsPage(pageId); break;
      case "donate": await TemplateHelper.createDonatePage(pageId); break;
      case "location": await TemplateHelper.createVisitPage(pageId); break;
    }
  }

  const handleSave = async () => {
    if (validate()) {
      let pageData = null;
      let linkData = null;
      if (pageTemplate !== "link") {
        let p = { ...page };
        const slugString = link?.text || page.title || "new-page";
        p.url = SlugHelper.slugifyString("/" + slugString.toLowerCase().replace(" ", "-"), "urlPath");

        pageData = await ApiHelper.post("/pages", [p], "ContentApi").then((data) => {
          setPage(data[0]);
          createTemplate(pageTemplate, data[0].id);
          return data[0];
        });
      }

      if (props.mode==="navigation") {
        const l = {...link};
        if (pageTemplate!== "link") l.url = pageData.url;
        linkData = await ApiHelper.post("/links", [l], "ContentApi").then(data => data[0] );
      }

      props.updatedCallback((pageTemplate !== "link") ? pageData : null, (props.mode==="navigation") ? linkData : null);

    }
  };

  const getTemplateButton = (key:string, icon:string, text:string) => (
    <Grid xs={3} item>
      <Button variant={(pageTemplate.toLowerCase() === key) ? "contained" : "outlined"} startIcon={<Icon>{icon}</Icon>} onClick={() => {setPageTemplate(key)}} fullWidth>{text}</Button>
    </Grid>
  )


  /*
  const handleSlugValidation = () => {
    const p = { ...page };

    setPage(p);
    setChecked(true);
  }*/

  useEffect(() => {
    setPage({ layout:"headerFooter" });
    setLink({churchId: UserHelper.currentUserChurch.church.id, category:"website", linkType:"url", sort:99} as LinkInterface);
  }, [props.mode]);

  if (!page && !link) return <></>
  else return (

    <Dialog open={true} onClose={props.onDone} className="dialogForm">
      <InputBox id="dialogForm" headerText={(pageTemplate==="link") ? "New Link" : "New Page"} headerIcon="article" saveFunction={handleSave} cancelFunction={handleCancel}>
        <ErrorMessages errors={errors} />

        <InputLabel>Page Type</InputLabel>


        <Grid container spacing={2}>
          {getTemplateButton("blank", "article", "Blank")}
          {getTemplateButton("sermons", "subscriptions", "Sermons")}
          {getTemplateButton("about", "quiz", "About Us")}
          {getTemplateButton("donate", "volunteer_activism", "Donate")}
          {getTemplateButton("location", "location_on", "Location")}
          {(props.mode === "navigation") && getTemplateButton("link", "link", "Link")}
        </Grid>

        <Grid container spacing={2}>
          {(pageTemplate !== "link")
          && <Grid xs={(props.mode === "navigation") ? 6 : 12} item>
            <TextField size="small" fullWidth label="Page Title" name="title" value={page.title} onChange={handleChange} onKeyDown={handleKeyDown} />
          </Grid>
          }
          {(pageTemplate === "link")
            && <Grid xs={(props.mode === "navigation") ? 6 : 12} item>
              <TextField size="small" fullWidth label="Link Url" name="linkUrl" value={link.url} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
            </Grid>
          }
          {(props.mode === "navigation")
          && <Grid xs={6} item>
            <TextField size="small" fullWidth label="Link Text" name="linkText" value={link.text} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
          </Grid>
          }
        </Grid>
      </InputBox>

    </Dialog>
  );
}
