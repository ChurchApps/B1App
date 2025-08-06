import { useState, useEffect } from "react";
import { ErrorMessages } from "@churchapps/apphelper";
import { InputBox } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { SlugHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { LinkInterface } from "@churchapps/helpers";
import { TemplateHelper } from "@/helpers/TemplateHelper";
import { PageInterface } from "@/helpers";
import { Button, Dialog, Grid, Icon, InputLabel, SelectChangeEvent, TextField } from "@mui/material";
import { useRouter } from "next/navigation";

type Props = {
  mode: string,
  updatedCallback: (page: PageInterface, link: LinkInterface) => void;
  onDone: () => void;
  requestedSlug?: string;
};

export function AddPageModal(props: Props) {
  const router = useRouter();
  const [page, setPage] = useState<PageInterface>(null);
  const [link, setLink] = useState<LinkInterface>(null);
  const [errors, setErrors] = useState([]);
  const [pageTemplate, setPageTemplate] = useState<string>("blank");
  const [aiDescription, setAiDescription] = useState<string>("");

  const handleCancel = () => props.onDone();
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
      if (pageTemplate === "ai" && (!aiDescription || aiDescription.trim() === "")) {
        errors.push("Please describe what you want on this page.");
      }
    }
    if (props.mode === "navigation") {
      if (!link.text || link.text === "") errors.push("Please enter link text.");
    }
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create pages");
    setErrors(errors);
    return errors.length === 0;
  };

  const createTemplate = async (type: string, pageId: string) => {
    switch (type) {
      case "blank": ; break;
      case "sermons": await TemplateHelper.createSermonsPage(pageId); break;
      case "about": await TemplateHelper.createAboutUsPage(pageId); break;
      case "donate": await TemplateHelper.createDonatePage(pageId); break;
      case "location": await TemplateHelper.createVisitPage(pageId); break;
      // AI pages are handled differently in handleSave
    }
  }

  const handleSave = async () => {
    if (validate()) {
      let pageData = null;
      let linkData = null;
      if (pageTemplate !== "link") {
        if (pageTemplate === "ai") {
          // Handle AI page creation differently
          const slugString = page.title || "new-page";
          const url = props.requestedSlug || SlugHelper.slugifyString("/" + slugString.toLowerCase().replace(/ /g, "-"), "urlPath");

          // Use TemplateHelper to create the AI page
          pageData = await TemplateHelper.createAIPage(page.title, aiDescription, url);
          setPage(pageData);
        } else {
          // Handle other page types normally
          let p = { ...page };
          const slugString = link?.text || page.title || "new-page";
          p.url = props.requestedSlug || SlugHelper.slugifyString("/" + slugString.toLowerCase().replace(" ", "-"), "urlPath");

          pageData = await ApiHelper.post("/pages", [p], "ContentApi").then((data: any) => {
            setPage(data[0]);
            createTemplate(pageTemplate, data[0].id);
            return data[0];
          });
        }
      }

      if (props.mode === "navigation") {
        const l = { ...link };
        if (pageTemplate !== "link") l.url = pageData.url;
        linkData = await ApiHelper.post("/links", [l], "ContentApi").then((data: any) => data[0]);
      }

      props.updatedCallback((pageTemplate !== "link") ? pageData : null, (props.mode === "navigation") ? linkData : null);

      // Redirect to the new AI page after creation
      /*
      if (pageTemplate === "ai" && pageData?.url) {
        router.push(pageData.url);
      }*/

    }
  };

  const selectTemplate = (template: string) => {
    const p = { ...page };
    const l = { ...link };
    const churchName = UserHelper.currentUserChurch.church.name || "";
    switch (template) {
      case "sermons": p.title = "View Sermons"; l.text = "Sermons"; break;
      case "about": p.title = "About " + churchName; l.text = "About Us"; break;
      case "donate": p.title = "Support " + churchName; l.text = "Donate"; break;
      case "location": p.title = "Directions to " + churchName; l.text = "Location"; break;
      case "ai": p.title = ""; l.text = "New Page"; break;
    }
    setPage(p);
    setLink(l);
    setPageTemplate(template);
  }

  const getTemplateButton = (key: string, icon: string, text: string) => (
    <Grid size={3}>
      <Button variant={(pageTemplate.toLowerCase() === key) ? "contained" : "outlined"} startIcon={<Icon>{icon}</Icon>} onClick={() => { selectTemplate(key) }} fullWidth data-testid={`template-${key}-button`}>{text}</Button>
    </Grid>
  )


  /*
  const handleSlugValidation = () => {
    const p = { ...page };

    setPage(p);
    setChecked(true);
  }*/

  useEffect(() => {
    setPage({ layout: "headerFooter" });
    setLink({ churchId: UserHelper.currentUserChurch.church.id, category: "website", linkType: "url", sort: 99 } as LinkInterface);
  }, [props.mode]);

  if (!page && !link) return <></>
  else return (

    <Dialog open={true} onClose={props.onDone} className="dialogForm">
      <InputBox id="dialogForm" headerText={(pageTemplate === "link") ? "New Link" : "New Page"} headerIcon="article" saveFunction={handleSave} cancelFunction={handleCancel} data-testid="add-page-modal">
        <ErrorMessages errors={errors} />

        <InputLabel>Page Type</InputLabel>


        <Grid container spacing={2}>
          {getTemplateButton("blank", "article", "Blank")}
          {getTemplateButton("sermons", "subscriptions", "Sermons")}
          {getTemplateButton("about", "quiz", "About Us")}
          {getTemplateButton("donate", "volunteer_activism", "Donate")}
          {getTemplateButton("location", "location_on", "Location")}
          {/*getTemplateButton("ai", "smart_toy", "AI")*/}
          {(props.mode === "navigation") && getTemplateButton("link", "link", "Link")}
        </Grid>

        <Grid container spacing={2}>
          {(pageTemplate !== "link")
            && <Grid size={(props.mode === "navigation") ? 6 : 12}>
              <TextField size="small" fullWidth label="Page Title" name="title" value={page.title || ""} onChange={handleChange} onKeyDown={handleKeyDown} data-testid="page-title-input" />
            </Grid>
          }
          {(pageTemplate === "link")
            && <Grid size={(props.mode === "navigation") ? 6 : 12}>
              <TextField size="small" fullWidth label="Link Url" name="linkUrl" value={link.url || ""} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
            </Grid>
          }
          {(props.mode === "navigation")
            && <Grid size={6}>
              <TextField size="small" fullWidth label="Link Text" name="linkText" value={link.text || ""} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
            </Grid>
          }
        </Grid>

        {(pageTemplate === "ai")
          && <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={4}
                label="Describe what you want on this page"
                name="aiDescription"
                value={aiDescription || ""}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="E.g., Create a page about our youth ministry programs with sections for activities, meeting times, and volunteer opportunities."
                data-testid="ai-description-input"
              />
            </Grid>
          </Grid>
        }
      </InputBox>

    </Dialog>
  );
}
