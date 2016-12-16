typedoc --out docs src/index.ts --module es2015 --mode file --theme minimal --readme USAGE.md
npm run stats
mv size.txt docs/