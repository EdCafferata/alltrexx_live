package login.auth.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// Message after validation of username and email address
@Getter
@Setter
@AllArgsConstructor
public class MessageResponse {

    private String message;

    public void setMessage(String message) {

        this.message = message;
    }
}
