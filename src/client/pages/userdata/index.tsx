import React from "react";

import { ModuleProvider } from "@onzag/itemize/client/providers/module";
import { ItemProvider } from "@onzag/itemize/client/providers/item";
import I18nRead from "@onzag/itemize/client/components/localization/I18nRead";
import TitleSetter from "@onzag/itemize/client/components/util/TitleSetter";
import UserDataRetriever from "@onzag/itemize/client/components/user/UserDataRetriever";
import Entry from "@onzag/itemize/client/components/property/Entry";
import {
  DoneOutlineIcon,
  FacebookIcon,
  InstagramIcon,
  PinterestIcon,
  RedditIcon,
  TwitterIcon,
} from "@onzag/itemize/client/fast-prototyping/mui-core";
import LanguageIcon from "@material-ui/icons/Language";
import Reader from "@onzag/itemize/client/components/property/Reader";
import View from "@onzag/itemize/client/components/property/View";
import SubmitActioner from "@onzag/itemize/client/components/item/SubmitActioner";
import Snackbar from "@onzag/itemize/client/fast-prototyping/components/snackbar";
import { SubmitButton } from "@onzag/itemize/client/fast-prototyping/components/buttons";

const elements = [
  "facebook",
  "twitter",
  "reddit",
  "pinterest",
  "instagram",
  "website_rss",
];

const idElements = elements.map((e) => e + "_id");

const properties = idElements.concat(elements.map((e) => e + "_last_updated"));

const icons = {
  facebook: <FacebookIcon />,
  twitter: <TwitterIcon />,
  reddit: <RedditIcon />,
  pinterest: <PinterestIcon />,
  instagram: <InstagramIcon />,
  website_rss: <LanguageIcon />,
};

export function UserData() {
  return (
    <UserDataRetriever>
      {(userData) => {
        return (
          <ModuleProvider module="users">
            <ItemProvider
              itemDefinition="user"
              properties={properties}
              forId={userData.id}
              includePolicies={false}
            >
              <I18nRead id="userdata" capitalize={true}>
                {(i18nUserData: string) => {
                  return <TitleSetter>{i18nUserData}</TitleSetter>;
                }}
              </I18nRead>

              {elements.map((e) => {
                return (
                  <React.Fragment key={e}>
                    <Entry id={e + "_id"} icon={icons[e]} />
                    <Reader id={e + "_id"} useAppliedValue={true}>
                      {(eId: string) => {
                        if (!eId) {
                          return null;
                        }

                        return (
                          <Reader id={e + "_last_updated"}>
                            {(eLastUpdated) => {
                              if (!eLastUpdated) {
                                return null;
                              }

                              return (
                                <I18nRead
                                  id="last_updated"
                                  args={[<View id={e + "_last_updated"} />]}
                                />
                              );
                            }}
                          </Reader>
                        );
                      }}
                    </Reader>
                  </React.Fragment>
                );
              })}

              <SubmitButton
                i18nId="update"
                options={{
                  properties: idElements,
                }}
                buttonColor="primary"
                buttonStartIcon={<DoneOutlineIcon />}
                buttonVariant="contained"
              />

              <SubmitActioner>
                {(actioner) => (
                  <>
                    <Snackbar
                      id="userdata-update-error"
                      severity="error"
                      i18nDisplay={actioner.submitError}
                      open={!!actioner.submitError}
                      onClose={actioner.dismissError}
                    />
                    <Snackbar
                      id="userdata-update-success"
                      severity="success"
                      i18nDisplay="userdata_updated_successfully"
                      open={actioner.submitted}
                      onClose={actioner.dismissSubmitted}
                    />
                  </>
                )}
              </SubmitActioner>
            </ItemProvider>
          </ModuleProvider>
        );
      }}
    </UserDataRetriever>
  );
}
