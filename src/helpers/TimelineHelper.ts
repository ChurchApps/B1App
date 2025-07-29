import { ApiHelper } from "@churchapps/apphelper";
import { ArrayHelper } from "@churchapps/apphelper";
import type { ConversationInterface } from "@churchapps/helpers";
import type { GroupInterface } from "@churchapps/helpers";
import type { PersonInterface } from "@churchapps/helpers";
import { TimelinePostInterface } from ".";

export class TimelineHelper {

  static async loadForUser() {
    const initialConversations:ConversationInterface[] = await ApiHelper.get("/conversations/posts", "MessagingApi");
    const allPosts = await TimelineHelper.loadRelatedData(initialConversations, null);
    TimelineHelper.mergeConversations(allPosts, initialConversations);
    const {people, groups} = await TimelineHelper.populatePostsAndPeople(allPosts);
    return {posts: allPosts, people, groups};
  }

  static async loadForGroup(groupId:string) {
    //Recent conversations for the group
    const initialConversations:ConversationInterface[] = await ApiHelper.get("/conversations/posts/group/" + groupId, "MessagingApi");
    //Posts for events and tasks
    const allPosts = await TimelineHelper.loadRelatedData(initialConversations, groupId);
    //Add conversations to the posts when possible and create new posts when not.
    TimelineHelper.mergeConversations(allPosts, initialConversations);
    //Fill in the people and groups for the posts
    const {people, groups} = await TimelineHelper.populatePostsAndPeople(allPosts);
    return {posts: allPosts, people, groups};
  }

  static async populatePostsAndPeople(allPosts:TimelinePostInterface[])
  {
    await TimelineHelper.populateConversations(allPosts);
    const {people, groups} = await TimelineHelper.populateEntities(allPosts);
    TimelineHelper.standardizePosts(allPosts, people);
    return {people, groups};
  }

  static async loadRelatedData(initialConversations: ConversationInterface[], groupId?:string) {
    const promises = [];
    const taskIds:string[] = [];
    const eventIds:string[] = [];
    const venueIds:string[] = [];
    const sermonIds:string[] = [];
    initialConversations.forEach((conv) => {
      if (conv.contentType==="task" && taskIds.indexOf(conv.contentId)===-1) taskIds.push(conv.contentId);
      if (conv.contentType==="event" && eventIds.indexOf(conv.contentId)===-1) eventIds.push(conv.contentId);
      if (conv.contentType==="venue" && venueIds.indexOf(conv.contentId)===-1) venueIds.push(conv.contentId);
      if (conv.contentType==="sermon" && venueIds.indexOf(conv.contentId)===-1) sermonIds.push(conv.contentId);
    });
    if (groupId) {
      promises.push(ApiHelper.get("/events/timeline/group/" + groupId + "?eventIds=" + eventIds.join(","), "ContentApi"));
    } else {
      promises.push(ApiHelper.get("/tasks/timeline?taskIds=" + taskIds.join(","), "DoingApi"));
      promises.push(ApiHelper.get("/events/timeline?eventIds=" + eventIds.join(","), "ContentApi"));
    }
    if (venueIds.length > 0) promises.push(ApiHelper.get("/venues/timeline?venueIds=" + venueIds.join(","), "LessonsApi"));
    if (sermonIds.length > 0) promises.push(ApiHelper.get("/sermons/timeline?sermonIds=" + sermonIds.join(","), "ContentApi"));
    const results = await Promise.all(promises);
    let allPosts:TimelinePostInterface[] = [];
    results.forEach((result:any[]) => {
      result.forEach((r) => {
        allPosts.push({ postId:r.postId, postType:r.postType, groupId:r.groupId, data:r})
      });
    });
    return allPosts;
  }

  static mergeConversations(allPosts:TimelinePostInterface[], initialConversations:ConversationInterface[]) {
    allPosts.forEach(p => { p.conversation={} })
    initialConversations.forEach((conv) => {
      let existingPost = ArrayHelper.getOne(allPosts, "postId", conv.contentId);
      if (existingPost) {
        existingPost.conversation = conv;
        if (conv.groupId) existingPost.groupId = conv.groupId;
      }
      else allPosts.push({postId: conv.contentId, postType:conv.contentType, groupId:conv.groupId, conversation: conv} );
    });
  }

  static async populateEntities(allPosts:TimelinePostInterface[]) {
    const peopleIds:string[] = [];
    const groupIds:string[] = [];
    allPosts.forEach(p => {
      p.conversation?.messages?.forEach(m => {
        if (m.personId && peopleIds.indexOf(m.personId) === -1) peopleIds.push(m.personId);
      });
      if (p.postType==="group" && p.conversation.contentId && groupIds.indexOf(p.conversation.contentId) === -1) groupIds.push(p.conversation.contentId);
      if (p.postType==="event" && p.data && p.data.groupId && groupIds.indexOf(p.data.groupId) === -1) groupIds.push(p.data.groupId);
      if (p.postType==="task") {
        if (p.data.associatedWithType==="person" && peopleIds.indexOf(p.data.associatedWithId) === -1) peopleIds.push(p.data.associatedWithId);
        if (p.data.createdByType==="person" && peopleIds.indexOf(p.data.createdById) === -1) peopleIds.push(p.data.createdById);
        if (p.data.assignedToType==="person" && peopleIds.indexOf(p.data.assignedToId) === -1) peopleIds.push(p.data.assignedToId);
        if (p.data.associatedWithType==="group" && peopleIds.indexOf(p.data.associatedWithId) === -1) groupIds.push(p.data.associatedWithId);
        if (p.data.createdByType==="group" && peopleIds.indexOf(p.data.createdById) === -1) groupIds.push(p.data.createdById);
        if (p.data.assignedToType==="group" && peopleIds.indexOf(p.data.assignedToId) === -1) groupIds.push(p.data.assignedToId);
      }
    });

    let people:PersonInterface[] = []
    let groups:GroupInterface[] = []

    if (peopleIds.length > 0 || groupIds.length > 0) {
      const data = await ApiHelper.get("/people/timeline?personIds=" + peopleIds.join(",") + "&groupIds=" + groupIds.join(","), "MembershipApi");
      if (data.people) people = data.people;
      if (data.groups) groups = data.groups;
    }

    return {people, groups};
  }

  static async populateConversations(allPosts:TimelinePostInterface[]) {
    const conversationIds:string[] = [];
    allPosts.forEach(p => {
      if (p.conversationId && conversationIds.indexOf(p.conversationId) === -1 && !p.conversation?.id) conversationIds.push(p.conversationId);
    });
    if (conversationIds.length > 0) {
      const allConversations: ConversationInterface[] = await ApiHelper.get("/conversations/timeline/ids?ids=" + conversationIds.join(","), "MessagingApi");
      allPosts.forEach(p => {
        if (!p.conversation?.id) p.conversation = ArrayHelper.getOne(allConversations, "conversationId", p.conversationId);
      });
    }
  }

  static standardizePosts(allPosts:TimelinePostInterface[], people:PersonInterface[]) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - 7);
    allPosts.forEach(p => {
      p.conversation?.messages?.forEach(m => {
        if (m.timeSent) m.timeSent = new Date(m.timeSent);
        m.person = ArrayHelper.getOne(people, "id", m.personId);
      });

      if (p.timeSent) p.timeSent = new Date(p.timeSent);
      if (!p.timeSent)
      {
        if (p.conversation?.messages?.length>0) p.timeSent = p.conversation.messages[0].timeSent || defaultDate;
        else p.timeSent = defaultDate;
      }
      if (p.conversation?.messages?.length>0) p.timeUpdated = p.conversation.messages[p.conversation.messages.length - 1].timeSent
      else p.timeUpdated = p.timeSent;


    });

    ArrayHelper.sortBy(allPosts, "timeUpdated", true);
  }

}
