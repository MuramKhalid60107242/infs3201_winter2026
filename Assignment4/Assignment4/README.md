Assignment 4 Test Users

Create these users manually in the `users` collection in MongoDB Compass.

User 1
- username: `admin1`
- password: `adminpass123`
- role: `admin`
- sha256 password hash: `e4abae53cc1cebe5fe89ea93882c699a5e71ab0bbf42a83b7d833975b61c4a41`

User 2
- username: `staff1`
- password: `staffpass123`
- role: `staff`
- sha256 password hash: `587ddfbc4b18cceb9d78c3583ae8be36e3ebd7946d361c1f98821c81f2619fc8`

Example documents:

```json
{
  "username": "admin1",
  "password": "e4abae53cc1cebe5fe89ea93882c699a5e71ab0bbf42a83b7d833975b61c4a41",
  "role": "admin"
}
```

```json
{
  "username": "staff1",
  "password": "587ddfbc4b18cceb9d78c3583ae8be36e3ebd7946d361c1f98821c81f2619fc8",
  "role": "staff"
}
```
