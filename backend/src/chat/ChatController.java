package chat;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@CrossOrigin(origins = "http://localhost:3000") // Allow requests from React app
public class ChatController {

    private final List<Message> messages = new ArrayList<>();
    private final Map<String, String> users = new ConcurrentHashMap<>(); // Mapping sessionId to username
    private final List<String> userNames = new ArrayList<>();
    private final SimpMessagingTemplate template;
    private final Map<String, List<Message>> privateMessages = new ConcurrentHashMap<>();

    public ChatController(SimpMessagingTemplate template) {
        this.template = template;
    }

    @MessageMapping("/sendUserMessage")
    public void sendUserMessage(Message message) {
        message.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm dd MMM")));
        String senderKey = message.getSender() + "_" + message.getRecipient();
        String recipientKey = message.getRecipient() + "_" + message.getSender();

        privateMessages.computeIfAbsent(senderKey, k -> new ArrayList<>()).add(message);
        privateMessages.computeIfAbsent(recipientKey, k -> new ArrayList<>()).add(message);

        template.convertAndSendToUser(message.getRecipient(), "/queue/messages", message);
        template.convertAndSendToUser(message.getSender(), "/queue/messages", message);
    }

    @GetMapping("user/chat/messages")
    @ResponseBody
    public List<Message> getUserMessages(@RequestParam String sender, @RequestParam String recipient) {
        String key = sender + "_" + recipient;
        return privateMessages.getOrDefault(key, new ArrayList<>());
    }

    // Maps messages sent to /app/sendMessage
    @MessageMapping("/sendMessage")
    // Return value is sent to the /topic/messages, which will broadcast it to all clients subscribed to this topic
    @SendTo("/topic/messages")
    public Message sendMessage(Message message) {
        message.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm dd MMM")));
        messages.add(message);
        return message;
    }

    @GetMapping("/chat/messages")
    @ResponseBody
    public List<Message> getMessages() {
        return messages;
    }

    @MessageMapping("/addUser")
    public void addUser(String username, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        users.put(sessionId, username);
        headerAccessor.getSessionAttributes().put("username", username);
        userNames.add(username);
        broadcastUserList();
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (users.containsKey(sessionId)) {
            userNames.remove(users.get(sessionId));
            users.remove(sessionId);
            broadcastUserList();
        }
    }

    private void broadcastUserList() {
        template.convertAndSend("/topic/users", userNames);
    }
}
