import React from "react";
import { ApiHelper, ArrayHelper, TimelinePostInterface } from "../../../helpers";
import { TimelinePost } from "./TimelinePost";
import { TimelineHelper } from "@/helpers/TimelineHelper";

interface Props {  }

export const Timeline: React.FC<Props> = (props) => {
  const [posts, setPosts] = React.useState<any[]>([]);


  const loadData = async () => {
    if (ApiHelper.isAuthenticated) {
      const promises = [];
      promises.push(ApiHelper.get("/tasks/posts", "DoingApi"));
      promises.push(ApiHelper.get("/events/posts", "ContentApi"));
      promises.push(ApiHelper.get("/conversations/posts", "MessagingApi"));
      const results = await Promise.all(promises);
      let allPosts:TimelinePostInterface[] = [];
      results.forEach((result) => {
        allPosts = allPosts.concat(...result)
      });

      await TimelineHelper.populateConversations(allPosts);
      TimelineHelper.standardizePosts(allPosts);

      console.log("ALL POSTS", allPosts);
      setPosts(allPosts);
    }
  }
  React.useEffect(() => { loadData() }, [ApiHelper.isAuthenticated]);

  if (posts?.length > 0) return (
    <>
      <h1>Latest Updates</h1>
      {posts.map((post) => (
        <TimelinePost post={post} key={post.postId} />
      ))}
    </>
  );
  else return <></>
}
