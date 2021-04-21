import { ISQLTableRowValue } from "@onzag/itemize/nodejs/base/Root/sql";
import {
  ServiceProvider,
  ServiceProviderType,
} from "@onzag/itemize/server/services";

import { articleTitles, feedContents, articleDescription, articleURL } from "./testdata";

const allElements = [
  "facebook",
  "twitter",
  "reddit",
  "instagram",
  "website_rss",
  "pinterest",
];

export class FeedRetriever extends ServiceProvider<null> {
  public static getType() {
    return ServiceProviderType.GLOBAL;
  }

  public initialize() {
    this.globalRedisSub.redisClient.on("message", this.onRedisMessage);
    this.globalRedisSub.redisClient.subscribe("UPDATE_ELEMENT");
  }

  public getRunCycleTime() {
    // 5 minutes, runs every 5 minutes
    return 300000;
  }

  public async requestUpdateConnectionsOnUser(
    user: ISQLTableRowValue,
  ) {
    const connections = await this.globalRawDB.databaseConnection.query(
      "SELECT " +
      "ARRAY(SELECT UNNEST(\"shared_articles_ids\") INTERSECT SELECT UNNEST(\"shared_articles_ids\") FROM \"MOD_users__IDEF_user\" WHERE \"MODULE_ID\" = $1) AS \"articles_in_common\", " +
      "\"MODULE_ID\" " +
      "FROM \"MOD_users__IDEF_user\" " +
      "WHERE \"MODULE_ID\" != $1",
      [
        user.id,
      ],
    );

    const current = await this.globalRawDB.databaseConnection.queryFirst(
      "SELECT \"shared_articles_ids\" FROM \"MOD_users__IDEF_user\" WHERE \"MODULE_ID\" = $1",
      [
        user.id,
      ],
    ) || [];

    const allGeneratedConnections = connections.rows.map((c) => {
      return {
        target: c.MODULE_ID,
        articles_in_common: c.articles_in_common.length ? c.articles_in_common : null,
        strength: (c.articles_in_common || []).length / current.articles_in_common,
      };
    });

    allGeneratedConnections.forEach(async (c) => {
      const generatedID = user.id + "." + c.target;

      const existingConnection = await this.globalRawDB.performRawDBSelect("datagraph/connection", (builder) => {
        builder.select("MODULE_ID").whereBuilder.andWhereColumn("MODULE_ID", generatedID);
        builder.limit(1);
      }, true);

      const sqlData = this.globalRawDB.processGQLValue("datagraph/connection", c, null, "english");

      if (!existingConnection) {
        sqlData.modSQL.container_id = "MAIN";
        sqlData.modSQL.created_by = user.id;

        await this.globalRawDB.performRawDBInsert("datagraph/connection", {
          values: [
            {
              itemTableInsert: sqlData.itemSQL,
              moduleTableInsert: sqlData.modSQL,
            },
          ],
        });
      } else {
        await this.globalRawDB.performRawDBUpdate("datagraph/connection", generatedID, null, {
          moduleTableUpdate: sqlData.modSQL,
          itemTableUpdate: sqlData.itemSQL,
        });
      }
    });

    console.log(connections.rows);
    console.log(current);
  }

  public async requestUpdateOnUser(
    user: ISQLTableRowValue | string,
    socialNetwork: string,
  ) {
    let actualUser: ISQLTableRowValue;
    if (typeof user === "string") {
      actualUser = await this.globalRawDB.performRawDBSelect("users/user", (builder) => {
        builder.selectAll().whereBuilder.andWhereColumn("id", user);
        builder.limit(1);
      })[0];

      if (!actualUser) {
        return;
      }
    } else {
      actualUser = user;
    }

    console.log("update user", actualUser.username, socialNetwork);

    const title = articleTitles[Math.floor(Math.random() * articleTitles.length)];
    const url = articleURL(title);
    const articleId = this.globalRawDB.provideHashableV5Id(url);
    const feedId = this.globalRawDB.provideRandomV4Id();

    const randomFeed = {
      content: feedContents[Math.floor(Math.random() * feedContents.length)],
      source: socialNetwork,
      extracted_articles_ids: [
        articleId,
      ],
      extracted_articles_urls: [
        url,
      ],
    };

    const randomArticle = {
      url,
      title,
      description: articleDescription(title),
      containing_feeds: [
        feedId,
      ],
      feeds_authors: [
        actualUser.id,
      ],
    };

    console.log("created", randomFeed);
    console.log("extracted", randomArticle);

    const articleWithThatId = await this.globalRawDB.performRawDBSelect("datagraph/article", (selecter) => {
      selecter.select("id", "containing_feeds", "feeds_authors").whereBuilder.andWhereColumn("id", articleId);
      selecter.limit(1);
    });

    return await this.globalRawDB.startTransaction(async (transactingRawDB) => {
      if (articleWithThatId.length === 1) {
        const currentFeedAuthors = articleWithThatId[0].feeds_authors || [];

        await transactingRawDB.performRawDBUpdate("datagraph/article", articleId, null, {
          itemTableUpdater: (builder) => {
            builder.set("\"containing_feeds\" = coalesce(\"containing_feeds\", '{}') || ARRAY[?]", [feedId]);
            if (!currentFeedAuthors.includes(actualUser.id)) {
              builder.set("\"feeds_authors\" = coalesce(\"feeds_authors\", '{}') || ARRAY[?]", [actualUser.id]);
            }
          },
        });
      } else {
        const insertingValues = this.globalRawDB.processGQLValue(
          "datagraph/article",
          randomArticle,
          null,
          "english",
        );
        insertingValues.modSQL.id = articleId;
        insertingValues.modSQL.container_id = "MAIN";

        await transactingRawDB.performRawDBInsert("datagraph/article", {
          values: [
            {
              itemTableInsert: insertingValues.itemSQL,
              moduleTableInsert: insertingValues.modSQL,
            },
          ],
        });
      }

      const feedInsertValues = this.globalRawDB.processGQLValue(
        "datagraph/feed",
        randomFeed,
        null,
        "english",
      );
      feedInsertValues.modSQL.id = feedId;
      feedInsertValues.modSQL.created_by = actualUser.id;
      feedInsertValues.modSQL.container_id = "MAIN";

      await transactingRawDB.performRawDBInsert("datagraph/feed", {
        values: [
          {
            itemTableInsert: feedInsertValues.itemSQL,
            moduleTableInsert: feedInsertValues.modSQL,
          },
        ],
      });

      if (!actualUser.shared_articles_ids || !actualUser.shared_articles_ids.includes(articleId)) {
        const newActualUser = await transactingRawDB.performRawDBUpdate("users/user", actualUser.id, null, {
          itemTableUpdater: (builder) => {
            builder.set("\"shared_articles_ids\" = coalesce(\"shared_articles_ids\", '{}') || ARRAY[?]", [articleId]);
          },
        });

        return newActualUser;
      }

      return actualUser;
    });
  }

  public async run() {
    console.log("MUST FETCH NEW POSTS FROM EVERY GIVEN USER");

    const allUsersToUpdateConnections = await Promise.all(allElements.map(async (e) => {
      const allUsers = await this.globalRawDB.performRawDBSelect("users/user", (builder) => {
        builder.selectAll().whereBuilder
          .andWhereColumnNotNull(e + "_id")
          .andWhere((subbuilder) => {
            subbuilder
              .andWhereColumnNull(e + "_last_updated")
              .orWhereColumn(e + "_last_updated", "<=", [
                "NOW() - INTERVAL '1 HOUR'",
                [],
              ]);
          });
      });

      const newAllUsers = await Promise.all(allUsers.map(async (u) => {
        const newUser = await this.requestUpdateOnUser(u, e);
        return newUser;
      }));

      return newAllUsers;
    }));

    const allUsersToUpdateConnectionsFiltered: ISQLTableRowValue[] = [];
    allUsersToUpdateConnections.forEach((uArr) => {
      uArr.forEach((user) => {
        const found = allUsersToUpdateConnectionsFiltered.find((u) => u.id === user.id);
        if (!found) {
          allUsersToUpdateConnectionsFiltered.push(user);
        }
      });
    });

    allUsersToUpdateConnectionsFiltered.forEach((user) => {
      this.requestUpdateConnectionsOnUser(user);
    });
  }

  public async onRedisMessage(channel: string, message: string) {
    if (channel === "UPDATE_ELEMENT") {
      const parsed = JSON.parse(message);
      const newUser = await this.requestUpdateOnUser(parsed.userId, parsed.element);
      this.requestUpdateConnectionsOnUser(newUser);
    }
  }
}
