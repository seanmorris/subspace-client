.PHONY: build build-prod clean

build:
	npx babel source --out-dir build/
	cp -rv source/style ./build
	cp -rv build/* ./

build-prod:
	npx babel source --out-file dist/subspace-client.js
	cp -rv source/style/**.css ./dist

dependencies:
	npm install

clean:
	rm -rf ./*.js
