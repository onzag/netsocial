import React from "react";

import I18nReadMany from "@onzag/itemize/client/components/localization/I18nReadMany";

import { Paper, createStyles, withStyles, WithStyles, Container, Typography } from "@onzag/itemize/client/fast-prototyping/mui-core";

/**
 * The information styles
 */
const infoStyles = createStyles({
  paper: {
    padding: "1rem",
  },
  container: {
    paddingTop: "1rem",
  },
  infoText: {
    padding: "1rem 1rem 0 1rem",
  },
});

/**
 * The information component
 * @param props the information props
 * @returns a react element
 */
export const Info = withStyles(infoStyles)((props: WithStyles<typeof infoStyles>) => {
  return (
    <Container maxWidth="md" className={props.classes.container}>
      <Paper className={props.classes.paper}>
        <I18nReadMany
          data={[
            { id: "info_content" },
            { id: "info_content_2" },
          ]}
        >
          {(i18nInfoContent1: string, i18nInfoContent2: string) => (
            <>
              <Typography variant="body1" className={props.classes.infoText}>
                {i18nInfoContent1}
              </Typography>
              <Typography variant="body1" className={props.classes.infoText}>
                {i18nInfoContent2}
              </Typography>
            </>
          )}
        </I18nReadMany>
      </Paper>
    </Container>
  );
});
