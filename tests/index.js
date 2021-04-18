const { ItemizeTest } = require("@onzag/itemize/testing/itemize");
const { Test } = require("@onzag/itemize/testing");
const puppeteer = require("puppeteer");

const HTTPS = process.env.HTTPS === "true" || false;
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || "8000";

// You are free to implement your own tests here
// the default itemize tester will anyway perform a lot of tests
// and should suffice most cases

class Tests extends Test {
    async before() {
        this.puppet = await puppeteer.launch();
    }
    describe() {
        // include a test branch
        this.define(
            "Itemize Tests",
            new ItemizeTest(HTTPS, HOST, PORT, this.puppet)
        );

        // you might define your own assertions
        // this.it("Should do a thing", async () => {})

        // Define your own tests here every test extends the test class
        // the itemize testing library is designed to generate a tree, of dynamic
        // tests, tests are classes, not files, and form a tree, this class
        // represents your root test, do not "execute" more than one root test at
        // a time, as a root test might kill the thread

        // refer to the documentation for more information, prefer the defaults node
        // https://nodejs.org/api/assert.html library for assertions
    }
    async after() {
        await this.puppet.close();
    }
}

const tests = new Tests();
tests.execute();