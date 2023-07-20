import { ApiHelper, ArrayHelper, ConversationInterface, PersonInterface, TimelinePostInterface } from ".";

export class TimelineHelper {

  static async populateEntities(allPosts:TimelinePostInterface[]) {
    const peopleIds:string[] = [];
    const groupIds:string[] = [];
    allPosts.forEach(p => {
      p.conversation?.messages?.forEach(m => {
        if (m.personId && peopleIds.indexOf(m.personId) === -1) peopleIds.push(m.personId);
      });
      if (p.postType==="group" && p.conversation.contentId && groupIds.indexOf(p.conversation.contentId) === -1) groupIds.push(p.conversation.contentId);
      if (p.postType==="event" && p.data.groupId && groupIds.indexOf(p.data.groupId) === -1) groupIds.push(p.data.groupId);
    });

    let data:any = {};

    if (peopleIds.length > 0 || groupIds.length > 0) {
      data = await ApiHelper.get("/people/timeline?personIds=" + peopleIds.join(",") + "&groupIds=" + groupIds.join(","), "MembershipApi");
    }
    return data;
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
      console.log("Message Count", p.conversation?.messages?.length || -1)
      p.conversation?.messages?.forEach(m => {
        if (m.timeSent) m.timeSent = new Date(m.timeSent);
        m.person = ArrayHelper.getOne(people, "id", m.personId);
        console.log("PERSON", m.personId, m.person);
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
    console.log("AFTER", allPosts)
  }

}
