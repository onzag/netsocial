/**
 * This file contains the fragments that are used accross the application
 * to create content fragments in different languages, if you don't need fragments
 * feel free do delete them from the schema and delete this file as well as remove
 * all the references from the cms/index.tsx file
 */

import React from "react";

import { ItemProvider } from "@onzag/itemize/client/providers/item";
import Entry from "@onzag/itemize/client/components/property/Entry";
import LocationStateReader from "@onzag/itemize/client/components/navigation/LocationStateReader";
import SubmitActioner from "@onzag/itemize/client/components/item/SubmitActioner";

import {
  Paper, createStyles, withStyles, WithStyles,
  Container, Box, List, ListItem, ListItemText,
  ExtensionIcon, ListItemIcon,
} from "@onzag/itemize/client/fast-prototyping/mui-core";
import { SubmitButton } from "@onzag/itemize/client/fast-prototyping/components/buttons";
import Snackbar from "@onzag/itemize/client/fast-prototyping/components/snackbar";
import { ITemplateArgsContext } from "@onzag/itemize/client/fast-prototyping/components/slate";
import Route from "@onzag/itemize/client/components/navigation/Route";
import Link from "@onzag/itemize/client/components/navigation/Link";
import { LanguagePicker } from "@onzag/itemize/client/fast-prototyping/components/language-picker";

/**
 * The most important bit that defines what fragments are available to modify
 * from within the CMS, these use custom keys; and you might add as many of
 * them as you like, they are defined by template args since every fragment
 * is allowed to be a template and can be rendered as such (even if it doesn't have to)
 * in cms/index.propext.json you can find out the content property and what it
 * supports
 */
const FRAGMENTS: { [key: string]: ITemplateArgsContext } = {
  /**
   * In this example you can see the header, the header uses a custom ID
   * and is loaded in the frontpage by passing it as ID for the fragment
   * item definition
   * 
   * This defines the context, now we are using hardcoded contexts in here
   * that don't support for multilingual design, because of the labels
   * we are giving in, which are in english
   * 
   * Labels can however also be i18n element types, as react nodes are allowed
   * so that enables multilingual functionality if required, for the purpose
   * of this basic CMS simple strings are used
   */
  "HEADER": {
    type: "context",
    label: "Header",
    properties: {},
  },
  "ACCOUNT_VALIDATION_EMAIL": {
    type: "context",
    label: "Account Validation Email",
    properties: {
      validate_account_link: {
        type: "link",
        label: "Validation Link",
      },
      username: {
        type: "text",
        label: "Username",
      },
    },
  },
  "ACCOUNT_RECOVERY_EMAIL": {
    type: "context",
    label: "Account Recovery Email",
    properties: {
      forgot_password_link: {
        type: "link",
        label: "Recovery Link",
      },
      username: {
        type: "text",
        label: "Username",
      },
    },
  },
}
const ALL_FRAGMENTS = Object.keys(FRAGMENTS);

/**
 * The fragment styles that are used
 * in the page itself
 */
const fragmentStyles = createStyles({
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
});

const FragmentIndex = withStyles(fragmentStyles)((props: WithStyles<typeof fragmentStyles>) => {
  return (
    <Container maxWidth="md" className={props.classes.container}>
      <Paper className={props.classes.paper}>
        <List>
          {ALL_FRAGMENTS.map((f) => {
            const fragmentContext = FRAGMENTS[f];
            return (
              <Link to={"/cms/fragment/" + f} key={f}>
                <ListItem className={props.classes.listItem}>
                  <ListItemIcon>
                    <ExtensionIcon />
                  </ListItemIcon>
                  <ListItemText primary={fragmentContext.label} secondary={f}/>
                </ListItem>
              </Link>
            );
          })}
        </List>
      </Paper>
    </Container>
  );
});

export function Fragment() {
  return (
    <>
      <Route
        path="/cms/fragment"
        exact={true}
        component={FragmentIndex}
      />
      <Route path="/cms/fragment/:id"
        exact={true}
        component={SingleFragment}
      />
    </>
  );
};

interface ISingleFragmentProps extends WithStyles<typeof fragmentStyles> {
  match: {
    params: {
      id: string;
    };
  };
}

/**
 * The fragment section itself that allows modifying and creating new fragments
 * @param props the fragment styles
 * @returns a react element
 */
const SingleFragment = withStyles(fragmentStyles)((props: ISingleFragmentProps) => {
  const fragmentId = props.match.params.id;
  return (
    <LocationStateReader defaultState={{ version: "" }} stateIsInQueryString={true}>
      {(locationState, setState) => {
        // here we will use a language picker down there to specify the version
        // of the fragment so multiple version fragments can be loaded
        const updateVersionState = (code: string) => {
          setState({
            version: code,
          }, true);
        };
        return (
          <ItemProvider
            itemDefinition="fragment"
            properties={[
              "title",
              "content",
              "attachments",
            ]}
            includePolicies={false}
            longTermCaching={false}
            forId={fragmentId}
            forVersion={locationState.version || null}
          >
            <Container maxWidth="md" className={props.classes.container + " trusted"}>
              <Paper className={props.classes.paper}>
                <Box className={props.classes.box}>
                  <LanguagePicker
                    currentCode={locationState.version || null}
                    allowUnspecified={true}
                    handleLanguageChange={updateVersionState}
                  />
                </Box>

                <Entry id="title" />
                <Entry
                  id="content"
                  rendererArgs={{
                    context: FRAGMENTS[fragmentId] || null,
                  }}
                />

                <SubmitButton
                  i18nId="submit"
                  buttonVariant="contained"
                  buttonColor="primary"
                  options={{
                    properties: [
                      "title",
                      "content",
                      "attachments",
                    ],
                  }}
                />

              </Paper>
            </Container>

            <SubmitActioner>
              {(actioner) => (
                <>
                  <Snackbar
                    id="submit-fragment-error"
                    severity="error"
                    i18nDisplay={actioner.submitError}
                    open={!!actioner.submitError}
                    onClose={actioner.dismissError}
                  />
                  <Snackbar
                    id="submit-fragment-success"
                    severity="success"
                    i18nDisplay="success"
                    open={actioner.submitted}
                    onClose={actioner.dismissSubmitted}
                  />
                </>
              )}
            </SubmitActioner>

          </ItemProvider>);
      }}
    </LocationStateReader>
  );
});
