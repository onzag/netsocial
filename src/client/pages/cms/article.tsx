/**
 * This file contains the articles, and are added just as an addon
 * in order to display the capabilities of itemize to handle such articles
 * in the test, feel free to remove articles, this file as well
 * as the json file it references in the cms
 */

import React, { useState } from "react";

import { ItemProvider } from "@onzag/itemize/client/providers/item";
import Entry from "@onzag/itemize/client/components/property/Entry";
import SubmitActioner from "@onzag/itemize/client/components/item/SubmitActioner";

import {
  Paper, createStyles, withStyles, WithStyles,
  Container, List, ListItem, ListItemText,
  WebIcon, ListItemIcon, IconButton, AddCircleIcon, Box,
} from "@onzag/itemize/client/fast-prototyping/mui-core";
import { SubmitButton } from "@onzag/itemize/client/fast-prototyping/components/buttons";
import Snackbar from "@onzag/itemize/client/fast-prototyping/components/snackbar";
import Route from "@onzag/itemize/client/components/navigation/Route";
import Link from "@onzag/itemize/client/components/navigation/Link";
import { LanguagePicker } from "@onzag/itemize/client/fast-prototyping/components/language-picker";
import { SearchLoaderWithPagination } from "@onzag/itemize/client/fast-prototyping/components/search-loader-with-pagination";
import View from "@onzag/itemize/client/components/property/View";
import AppLanguageRetriever from "@onzag/itemize/client/components/localization/AppLanguageRetriever";
import Setter from "@onzag/itemize/client/components/property/Setter";

/**
 * The article styles that are used
 * in the page itself
 */
const articleStyles = createStyles({
  paper: {
    padding: "1rem",
  },
  container: {
    paddingTop: "1rem",
  },
  box: {
    paddingBottom: "1rem",
  },
  listItem: {
    borderBottom: "solid 1px #ccc",
    transition: "backgroundColor 0.3s",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.05)",
    },
  },
  paginatorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingTop: "1rem",
  },
});

const ArticleIndex = withStyles(articleStyles)((props: WithStyles<typeof articleStyles>) => {
  const [locale, setLocale] = useState<string>(null);
  function setLocaleFiltered(newCode: string) {
    setLocale(newCode);
  }
  return (
    <Container maxWidth="md" className={props.classes.container}>
      <Paper className={props.classes.paper}>
        <Link to="/cms/article/new">
          <IconButton>
            <AddCircleIcon />
          </IconButton>
        </Link>
        <LanguagePicker
          currentCode={locale}
          allowUnspecified={true}
          handleLanguageChange={setLocaleFiltered}
        />
        <List>
          <ItemProvider
            itemDefinition="article"
            searchCounterpart={true}
            automaticSearch={{
              limit: 500,
              offset: 0,
              requestedProperties: [
                "title",
              ],
              searchByProperties: [
                "locale"
              ],
            }}
            setters={
              [
                {
                  id: "locale",
                  searchVariant: "search",
                  value: locale,
                },
              ]
            }
          >
            <SearchLoaderWithPagination
              id="article-search-loader"
              pageSize={10}
            >
              {(arg, pagination) => {
                return (
                  <>
                    {arg.searchRecords.map((r) => {
                      return (
                        <ItemProvider {...r.providerProps}>
                          <Link to={"/cms/article/" + r.id} key={r.id}>
                            <ListItem className={props.classes.listItem}>
                              <ListItemIcon>
                                <WebIcon />
                              </ListItemIcon>
                              <ListItemText primary={<View id="title" />} secondary={r.id} />
                            </ListItem>
                          </Link>
                        </ItemProvider>
                      );
                    })}
                    <div className={props.classes.paginatorContainer}>
                      {pagination}
                    </div>
                  </>
                );
              }}
            </SearchLoaderWithPagination>
          </ItemProvider>
        </List>
      </Paper>
    </Container>
  );
});

export function Article() {
  return (
    <>
      <Route
        path="/cms/article"
        exact={true}
        component={ArticleIndex}
      />
      <Route
        path="/cms/article/:id"
        exact={true}
        component={SingleArticle}
      />
    </>
  );
};

interface ISingleArticleProps extends WithStyles<typeof articleStyles> {
  match: {
    params: {
      id: string;
    };
  };
}

interface ILocaleEntry {
  code: string;
}

/**
 * This component allows for setting the locale using the
 * language picker rather than the standard entry, for that we
 * take the language code from the app language retriever and create
 * a state based on that for the initial state, and now we can
 * define a setter with the language picker
 * @param props the locale entry props that we defined before
 */
function LocaleEntry(props: ILocaleEntry) {
  const [locale, setLocale] = useState(props.code);
  function setLocaleFiltered(newCode: string) {
    setLocale(newCode);
  }
  return (
    <>
      <Setter id="locale" value={locale} />
      <LanguagePicker
        currentCode={locale}
        handleLanguageChange={setLocaleFiltered}
      />
    </>
  );
}

/**
 * The fragment section itself that allows modifying and creating new fragments
 * @param props the fragment styles
 * @returns a react element
 */
const SingleArticle = withStyles(articleStyles)((props: ISingleArticleProps) => {
  const articleId = props.match.params.id;
  return (
    <ItemProvider
      itemDefinition="article"
      properties={[
        "title",
        "content",
        "attachments",
        "locale",
        "summary",
        "summary_image",
      ]}
      includePolicies={false}
      longTermCaching={false}
      forId={articleId === "new" ? null : articleId}
    >
      <Container maxWidth="md" className={props.classes.container + " trusted"}>
        <Paper className={props.classes.paper}>
          <Box className={props.classes.box}>
            {
              articleId !== "new" ?
                (
                  <View id="locale" />
                ) :
                (
                  <AppLanguageRetriever>
                    {(arg) => (
                      <LocaleEntry code={arg.currentLanguage.code} />
                    )}
                  </AppLanguageRetriever>
                )
            }
          </Box>

          <Entry id="title" />
          <Entry id="summary" />
          <Entry id="content" />
          <Entry id="summary_image" />

          <SubmitButton
            i18nId="submit"
            buttonVariant="contained"
            buttonColor="primary"
            options={{
              properties: [
                "title",
                "content",
                "attachments",
                "locale",
                "summary",
                "summary_image",
              ],
            }}
          />

        </Paper>
      </Container>

      <SubmitActioner>
        {(actioner) => (
          <>
            <Snackbar
              id="submit-article-error"
              severity="error"
              i18nDisplay={actioner.submitError}
              open={!!actioner.submitError}
              onClose={actioner.dismissError}
            />
            <Snackbar
              id="submit-article-success"
              severity="success"
              i18nDisplay="success"
              open={actioner.submitted}
              onClose={actioner.dismissSubmitted}
            />
          </>
        )}
      </SubmitActioner>

    </ItemProvider>
  );
});