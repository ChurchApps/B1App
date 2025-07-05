import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import type { LoginResponseInterface, UserInterface } from "@churchapps/apphelper/dist/helpers/Interfaces";

type Payload = UserInterface | { jwt: string } | { authGuid: string };

export function login(data: Payload): Promise<LoginResponseInterface> {
  return new Promise(async (resolve, reject) => {
    try {
      const response: LoginResponseInterface = await ApiHelper.postAnonymous("/users/login", data, "MembershipApi");

      if (response.errors) reject(handleErrorType(response.errors));

      resolve(response);
    } catch (err) {
      reject(err.toString());
    }
  });
}

function handleErrorType(errors: string[]) {
  if (errors[0] === "No permissions") {
    return "The provided login does not have access to this application.";
  }
  return "Invalid login. Please check your email or password.";
}
