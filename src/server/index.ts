import { initializeServer } from "@onzag/itemize/server";

// Check the client for info on these, we are replicating what is used in the client somewhat
import React from "react";
import App from "../client/app";
import { rendererContext } from "@onzag/itemize/client/fast-prototyping/renderers";
import {
  appWrapper,
  mainWrapper,
} from "@onzag/itemize/client/fast-prototyping/wrappers";
import { styleCollector } from "@onzag/itemize/client/fast-prototyping/collectors";
import { IOTriggerActions } from "@onzag/itemize/server/resolvers/triggers";

// Itemize server isn't hot, it won't refresh in realtime and it
// isn't recommended to attempt to set it up that way

// for a given build number all the resources are considered equal,
// resources are contained within the /rest/resources/ endpoint during
// development of the app remember to disable service workers by making it
// bypass for network or otherwise the content you will get will always be the
// same, this bypasses the build number functionality on the client side
// but only after reload

// some changes require a server reload as well, such as enforcing a new build number
// adding new languages, changing API keys, etc... and of course, changing server code

// itemize is heavily offline so it always attempts not to call the server, itemize
// apps are also aware of when they are not connected to the server and it doesn't make
// them crash (except in development mode with service workers off)

// when a new version of an itemize app is deployed the client can realize that
// due to a new build number that doesn't match its internal build number, which will
// trigger the refresh of all the resources and wipes the client side caches a refresh
// is requested, if the app is just being launched when that is detected, it will refresh
// immediately and load the new version, otherwise if it happens while the user uses the app
// it will mark the app as outdated and you can have custom logic for outdated apps
// outdated apps only exists for that session

const elements = [
  "facebook",
  "twitter",
  "reddit",
  "pinterest",
  "instagram",
  "website_rss",
];

initializeServer(
  {
    // These are the same as of the client side
    rendererContext,
    mainComponent: React.createElement(App, null),
    mainWrapper,
    appWrapper,
    // the style collector which collects style for material UI SSR
    collector: styleCollector,
  },
  {
    seoRules: {
      "/": {
        crawable: true,
      },
      "profile/:id": {
        crawable: true,
        collect: [
          {
            module: "users",
            item: "user",
          },
        ],
      },
    },
  },
  {
    customTriggers: {
      item: {
        io: {
          "users/user": (arg) => {
            if (arg.action === IOTriggerActions.EDITED) {
              elements.forEach((element) => {
                const elementId = element + "_id";
                const updatedElementId =
                  arg.originalValue[elementId] !== arg.newValue[elementId] &&
                  arg.newValue[elementId];

                if (updatedElementId) {
                  arg.appData.redisPub.redisClient.publish(
                    "UPDATE_ELEMENT",
                    JSON.stringify({
                      userId: arg.id,
                      element,
                      value: arg.newValue[elementId],
                    }),
                  );
                }
              });
            }

            return null;
          },
        },
      },
    },
  },
);
