import React from "react";
import { ApiHelper, GroupInterface, PersonInterface, UserContextInterface } from "@churchapps/apphelper";
import { TimelinePost } from "./TimelinePost";
import { TimelineHelper } from "@/helpers/TimelineHelper";

interface Props { context: UserContextInterface; groupId: string;}

export const GroupTimeline: React.FC<Props> = (props) => {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [groups, setGroups] = React.useState<GroupInterface[]>([]);


  //1 Load recent messaging conversations
  //2 Load events and task details (including ones not mentioned by conversations)
  //3 Load additional conversations for events and tasks
  //4 Load all people and groups


  const loadData = async () => {
    if (ApiHelper.isAuthenticated) {
      /*
      const allPosts:TimelinePostInterface[] = await TimelineHelper.loadForGroup(props.groupId);
      await TimelineHelper.populateConversations(allPosts);
      const data = await TimelineHelper.populateEntities(allPosts);
      if (data.people) setPeople(data.people);
      if (data.groups) setGroups(data.groups);

      TimelineHelper.standardizePosts(allPosts, data.people);
      */
      const {posts, people, groups} = await TimelineHelper.loadForGroup(props.groupId);
      setPeople(people);
      setGroups(groups);
      setPosts(posts);
    }
  }




  React.useEffect(() => { loadData() }, [ApiHelper.isAuthenticated]);

  if (posts?.length > 0) return (
    <>
      <h1>Latest Updates</h1>
      {posts.map((post) => (
        <TimelinePost condensed={true} post={post} key={post.postId} context={props.context} people={people} groups={groups} onUpdate={loadData} />
      ))}
    </>
  );
  else return <></>
}
