import { ApiHelper, ArrayHelper, TimelineConversationInterface, TimelinePostInterface } from ".";

export class TimelineHelper {

  static async populateConversations(allPosts:TimelinePostInterface[]) {
    const conversationIds:string[] = [];
    allPosts.forEach(p => {
      if (p.conversationId) conversationIds.push(p.conversationId);
      p.conversation = null;
    });
    if (conversationIds.length > 0) {
      const allConversations: TimelineConversationInterface[] = await ApiHelper.get("/conversations/timeline/ids?ids=" + conversationIds.join(","), "MessagingApi");
      allPosts.forEach(p => {
        p.conversation = ArrayHelper.getOne(allConversations, "conversationId", p.conversationId);
      });
    }
  }

  static standardizePosts(allPosts:TimelinePostInterface[]) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - 7);
    allPosts.forEach(p => {
      if (p.conversation?.firstPost?.timeSent) p.conversation.firstPost.timeSent = new Date(p.conversation.firstPost.timeSent);
      if (p.conversation?.lastPost?.timeSent) p.conversation.lastPost.timeSent = new Date(p.conversation.lastPost.timeSent);
      if (p.timeSent) p.timeSent = new Date(p.timeSent);

      if (!p.timeSent) p.timeSent = p.conversation?.firstPost?.timeSent || defaultDate;
      p.timeUpdated = p.conversation?.lastPost?.timeSent || p.timeSent;
    });

    console.log("BEFORE", allPosts)
    ArrayHelper.sortBy(allPosts, "timeUpdated", true);
    console.log("AFTER", allPosts)
  }

}
