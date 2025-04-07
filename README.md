# Mindcare

## How to run

Start postgresql and create a database named mindcare.

In the ```.env``` file, line 1 is:

```
DATABASE_URL=postgres://your_username@localhost:5432/mindcare
```

Change ```your_username``` to your username. To get your username, run 
```
whoami
```

Then run

```
npm run dev
```

Go to ```localhost://8080``` to use the webapp.