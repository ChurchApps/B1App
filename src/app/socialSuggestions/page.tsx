"use client";

import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { Button, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";

export default function SocialSuggestions() {
  const [url, setUrl] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const [lessonOutline, setLessonOutline] = useState({ url: "", title: "", author: "" });
  const [scriptLoading, setScriptLoading] = useState(false);
  const [lessonOutlineResult, setLessonOutlineResult] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const o = { ...lessonOutline };
    const value = e.target.value;
    switch (e.target.name) {
      case "url": o.url = value; break;
      case "title": o.title = value; break;
      case "author": o.author = value; break;
    }
    setLessonOutline(o);
  }

  const getYouTubeKey = (youtubeInput: string) => {
    let result = youtubeInput.split("&")[0];
    result = result
      .replace("https://www.youtube.com/watch?v=", "")
      .replace("https://youtube.com/watch?v=", "")
      .replace("https://youtu.be/", "")
      .replace("https://www.youtube.com/embed/", "")
      .replace("https://studio.youtube.com/video/", "")
      .replace("/edit", "");
    return result;
  };

  const handleFetchPosts = () => {
    setLoading(true);
    ApiHelper.get("/sermons/socialSuggestions?youtubeVideoId=" + getYouTubeKey(url), "ContentApi")
      .then((data: any) => {
        if (data.error === null) {
          setErrors([]);
          setPosts(data.posts);
        } else if (data.error.includes("Could not load subtitles for this video. Though here are some general post ideas for you to use.")) {
          setErrors([data.error]);
          setPosts(data.posts);
        } else {
          setErrors([data.error]);
          setPosts([]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOutlineFetch = () => {
    setScriptLoading(true);
    setLessonOutlineResult("");
    ApiHelper.get(`/sermons/outline?url=${encodeURIComponent(lessonOutline.url)}&title=${lessonOutline.title}&author=${lessonOutline.author}`, "ContentApi")
      .then((data: any) => {
        setLessonOutlineResult(data.outline)
    })
    .finally(() => {
      setScriptLoading(false);
      setLessonOutline({ url: "", title: "", author: "" })
    })
  }

  return (
    <>
      <ErrorMessages errors={errors} />
      <Grid container>
        <Grid size={{ xs: 12, md: 6 }}>
          <div style={{ margin: 20 }}>
            <TextField
              label="YouTube URL"
              helperText="Enter YouTube URL"
              size="small"
              onChange={(e) => {setUrl(e.target.value);}}
              value={url}
              data-testid="youtube-url-input"
            />
            <Typography>videoId: {getYouTubeKey(url)}</Typography>
            <br />
            <Button
              variant="contained"
              color="primary"
              onClick={handleFetchPosts}
              disabled={loading || !url || url === ""}
              data-testid="fetch-posts-button"
            >
              {loading ? "Loading.." : "Fetch Posts"}
            </Button>
          </div>
          <div style={{ margin: 20 }}>
            {posts?.map((post: any) => (
              <div style={{ padding: 20 }}>{JSON.stringify(post)}</div>
            ))}
          </div>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <div style={{ margin: 20 }}>
            <TextField
              helperText="Enter sermon script URL"
              size="small"
              required
              label="URL"
              name="url"
              onChange={handleChange}
              value={lessonOutline.url}
              data-testid="sermon-script-url-input"
            />
            <br />
            <br />
            <Typography fontSize={14} fontStyle="italic">Please enter Sermon Title and Author just in case if the link doesn't work or it isn't accesible to public.</Typography>
            <Grid container spacing={2}>
              <Grid size={6}><TextField size="small" fullWidth required label="Sermon Title" name="title" onChange={handleChange} value={lessonOutline.title} data-testid="sermon-title-input" /></Grid>
              <Grid size={6}><TextField size="small" fullWidth required label="Author / Speaker" name="author" onChange={handleChange} value={lessonOutline.author} data-testid="sermon-author-input" /></Grid>
            </Grid>
            <br />
            <Button
              variant="contained"
              color="primary"
              onClick={handleOutlineFetch}
              disabled={scriptLoading || !lessonOutline.url || lessonOutline.url === "" || !lessonOutline.title || lessonOutline.title === "" || !lessonOutline.author || lessonOutline.author === ""}
              data-testid="fetch-outline-button"
            >
              {scriptLoading ? "Loading.." : "Fetch Outline"}
            </Button>
          </div>
          <div style={{ margin: 20 }}>
            {lessonOutlineResult && <div style={{ padding: 20 }}>{lessonOutlineResult}</div>}
          </div>
        </Grid>
      </Grid>
    </>
  );
}
