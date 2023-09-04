import React from "react";
import { TimelinePostInterface } from "../../../helpers";
import { ApiHelper, ArrayHelper, ConversationInterface, GroupInterface, PersonInterface, UserContextInterface } from "@churchapps/apphelper";
import { TimelinePost } from "./TimelinePost";
import { TimelineHelper } from "@/helpers/TimelineHelper";

interface Props { context: UserContextInterface; }

export const Timeline: React.FC<Props> = (props) => {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [groups, setGroups] = React.useState<GroupInterface[]>([]);


  //1 Load recent messaging conversations
  //2 Load events and task details (including ones not mentioned by conversations)
  //3 Load additional conversations for events and tasks
  //4 Load all people and groups


  const loadData = async () => {
    if (ApiHelper.isAuthenticated) {

      const initialConversations:ConversationInterface[] = await ApiHelper.get("/conversations/posts", "MessagingApi");
      const allPosts:TimelinePostInterface[] = await loadDetails(initialConversations);
      await TimelineHelper.populateConversations(allPosts);
      const data = await TimelineHelper.populateEntities(allPosts);
      if (data.people) setPeople(data.people);
      if (data.groups) setGroups(data.groups);

      TimelineHelper.standardizePosts(allPosts, data.people);

      setPosts(allPosts);
    }
  }


  const loadDetails = async (initialConversations:ConversationInterface[]) => {
    const promises = [];
    const taskIds:string[] = [];
    const eventIds:string[] = [];
    initialConversations.forEach((conv) => {
      if (conv.contentType==="task" && taskIds.indexOf(conv.contentId)===-1) taskIds.push(conv.contentId);
      if (conv.contentType==="event" && eventIds.indexOf(conv.contentId)===-1) eventIds.push(conv.contentId);
    });
    promises.push(ApiHelper.get("/tasks/timeline?taskIds=" + taskIds.join(","), "DoingApi"));
    promises.push(ApiHelper.get("/events/timeline?eventIds=" + eventIds.join(","), "ContentApi"));
    const results = await Promise.all(promises);
    let allPosts:TimelinePostInterface[] = [];
    results.forEach((result:any[]) => {
      result.forEach((r) => {
        allPosts.push({ postId:r.postId, postType:r.postType, data:r})
      });
    });
    allPosts.forEach(p => { p.conversation={} })
    initialConversations.forEach((conv) => {
      if (conv.contentType==="task" || conv.contentType==="event") {
        let existingPost = ArrayHelper.getOne(allPosts, "postId", conv.contentId);
        if (existingPost) {
          existingPost.conversation = conv;
        }
      }
      else {
        allPosts.push({postId: conv.contentId, postType:conv.contentType, conversation: conv} );
      }
    });
    return allPosts;
  }


  React.useEffect(() => { loadData() }, [ApiHelper.isAuthenticated]);

  if (posts?.length > 0) return (
    <>
      <h1>Latest Updates</h1>
      {posts.map((post) => (
        <TimelinePost post={post} key={post.postId} context={props.context} people={people} groups={groups} />
      ))}
    </>
  );
  else return <></>
}
