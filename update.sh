git fetch
git pull
cd server || exit 1
npm i
cd ../website || exit 1
npm i
npm run build
cd ../
