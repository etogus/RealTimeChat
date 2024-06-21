package chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Controller
public class ChatController {

    private final List<Message> messages = new ArrayList<>();
    private final List<String> usernames = new ArrayList<>();
    private final SimpMessagingTemplate template;

    public ChatController(SimpMessagingTemplate template) {
        this.template = template;
    }

    // Maps messages sent to /app/sendMessage
    @MessageMapping("/sendMessage")
    // Return value is sent to the /topic/messages, which will broadcast it to all clients subscribed to this topic
    @SendTo("/topic/messages")
    public Message sendMessage(Message message) {
        message.setDate(LocalDateTime.now().toString());
        messages.add(message);
        return message;
    }

    @GetMapping("/chat/messages")
    @ResponseBody
    public List<Message> getMessages() {
        return messages;
    }

    public void addUser(String username) {
        if (!usernames.contains(username)) {
            usernames.add(username);
        } else {
            throw new IllegalArgumentException("Username already taken");
        }
    }
}
