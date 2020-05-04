**Booking Manager**
----

  To start the server:

  > node index.js

  To run all tests:

  > npm test

  To run all tests with coverage report:

  > npm run ctest

**Endpoints**
---

**/api/authenticate**

* **Method:**

  `POST`

* **Data Params**

  { email: "test@email.com", password: "testing123" }

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ token: "eyJhb...", fullName: "Name Surname" }`

* **Sample Call:**

    ```
    axios
      .post(this.endpoint, { email, password })
      .then(res => console.log(res.data.token));
    ```

**/api/users**

* **Method:**

  `GET`

* **Headers**

  * **x-auth-token**
  
    The token is necessary for authentication and authorization. To get the token, login.
    Only admins can access the resource.

* **Success Response:**

  * **Code:** 200 <br />

    Returns an array containing the list of users.

    **Content:** `[{ _id : 1, name: "Name", surname: "Surname", message: false, enabled: true }]`
 
* **Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Access denied. No token provided." }`
    **Content:** `{ error : "Not authorized." }`

  OR

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "Invalid token." }`