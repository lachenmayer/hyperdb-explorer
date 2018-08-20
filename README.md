# hyperdb-explorer

An interactive CLI tool to explore the contents of a hyperdb.

Point it to a hyperdb folder, and you will see all of the keys inside the db.

Navigate up & down in the list using arrow keys.

Start typing to filter keys.

Press `enter` to see the value & feed metadata for that key.

Press `enter` again to get back to the list.

`ctrl-C` to quit.

Simple :)

## Usage

```
npx hyperdb-explorer <path-to-hyperdb>
```

...or to install it permanently:

```
npm install -g hyperdb-explorer
hyperdb-explorer <path-to-hyperdb>
```
