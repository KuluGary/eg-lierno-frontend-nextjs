import { getOperatorString } from "@lierno/core-helpers";
import {
  getAbilitiesString,
  getAttackStrings,
  getExperienceByCr,
  getModifier,
  getSavingThrowString,
  getSpeedString,
} from "@lierno/dnd-helpers";
import { Delete as DeleteIcon, Edit as EditIcon, FileDownload as FileDownloadIcon } from "@mui/icons-material";
import { Box, CircularProgress, Grid, IconButton, Typography, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Layout, Metadata } from "components";
import { CreatureFlavor, CreatureStats } from "components/CreatureProfile";
import download from "downloadjs";
import Api from "helpers/api";
import { ArrayUtil } from "helpers/string-util";
import { getToken } from "next-auth/jwt";
import Head from "next/head";
import Router from "next/router";
import { useState } from "react";
import { toast } from "react-toastify";

export default function NpcProfile({ npc, spells, items, classes }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const theme = useTheme();

  const downloadPdf = () => {
    setIsDownloading(true);

    Api.fetchInternal("/npc/sheet/pdf/" + npc["_id"])
      .then((base64Url) => download(base64Url, `${npc["name"]}.png`, "image/png"))
      .catch((err) => toast.error(err?.message))
      .finally(() => setIsDownloading(false));
  };

  return (
    <Layout>
      <Metadata
        title={(npc?.name ?? "") + " | Lierno App"}
        image={npc?.flavor.portrait?.original}
        description={npc?.flavor.personality}
      />
      <Head>
        <title>{npc?.name + " | Lierno App"}</title>
      </Head>
      <Grid container spacing={1} sx={{ height: "100%" }}>
        <Grid item laptop={6} tablet={12}>
          <CreatureFlavor
            containerStyle={{
              height: "90vh",
              overflowY: "scroll",
              ...theme.mixins.noScrollbar,
            }}
            data={{
              sections: [
                { title: "Personalidad", content: npc?.flavor.personality },
                { title: "Apariencia", content: npc?.flavor.appearance },
                { title: "Historia", content: npc?.flavor.backstory },
              ],
              image: npc?.flavor.portrait?.original,
            }}
            Header={() => (
              <Box
                component="main"
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingInline: "1em" }}
              >
                <Box component="div" sx={{ display: "flex", alignItems: "center" }}>
                  <Box>
                    <Typography variant="h5" component="h1">
                      {npc?.name}
                    </Typography>
                    <Typography variant="subtitle1">
                      {[npc.flavor.class, npc.stats.race, npc.stats.alignment]
                        .filter((el) => el && el.length > 0)
                        .map((el, i) => (i > 0 ? el.toLowerCase() : el))
                        .join(", ")}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", height: "100%" }}>
                  <Box component="div" sx={{ margin: "0 .25em" }}>
                    <IconButton
                      color="secondary"
                      sx={{
                        border: "1px solid rgba(63, 176, 172, 0.5);",
                        borderRadius: "8px",
                        padding: ".25em",
                        transition: theme.transitions.create(["border"], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        "&:hover": {
                          border: "1px solid rgba(63, 176, 172, 1);",
                        },
                      }}
                    >
                      <EditIcon onClick={() => Router.push(`/npcs/add/${npc._id}`)} fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box component="div" sx={{ margin: "0 .25em" }}>
                    <IconButton
                      color="secondary"
                      sx={{
                        border: "1px solid rgba(63, 176, 172, 0.5);",
                        borderRadius: "8px",
                        padding: ".25em",
                        transition: theme.transitions.create(["border"], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        "&:hover": {
                          border: "1px solid rgba(63, 176, 172, 1);",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box component="div" sx={{ margin: "0 .25em" }}>
                    <IconButton
                      color="secondary"
                      onClick={downloadPdf}
                      disabled={isDownloading}
                      sx={{
                        border: "1px solid rgba(63, 176, 172, 0.5);",
                        borderRadius: "8px",
                        padding: ".25em",
                        transition: theme.transitions.create(["border"], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        "&:hover": {
                          border: "1px solid rgba(63, 176, 172, 1);",
                        },
                      }}
                    >
                      {isDownloading ? (
                        <CircularProgress color="secondary" size={20} />
                      ) : (
                        <FileDownloadIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}
          />
        </Grid>

        <Grid item laptop={6} tablet={12}>
          <CreatureStats
            containerStyle={{
              height: "90vh",
              overflowY: "scroll",
              ...theme.mixins.noScrollbar,
            }}
            data={{
              classes,
              character: npc,
              stats: npc["stats"]["abilityScores"],
              proficiencyBonus: npc["stats"]["proficiencyBonus"],
              proficiencies: [
                {
                  key: "hitPoints",
                  title: "Puntos de vida",
                  content: `${npc["stats"]["hitPoints"]["current"] ?? npc["stats"]["hitPoints"]["max"]} / ${
                    npc["stats"]["hitPoints"]["max"]
                  } (${npc["stats"]["hitDie"]["num"]}d${npc["stats"]["hitDie"]["size"]} ${getOperatorString(
                    getModifier(npc["stats"]["abilityScores"]["constitution"]) * npc["stats"]["hitDie"]["num"]
                  )})`,
                },
                {
                  key: "armorClass",
                  title: "Clase de armadura",
                  content: `${npc["stats"]["armorClass"]} (${
                    ArrayUtil.isNotEmpty(npc.stats.equipment?.armor)
                      ? npc.stats.equipment?.armor
                          .filter((armor) => armor.equipped)
                          .map((armor) => items.find((item) => item.id === armor.id)?.name?.toLowerCase())
                          .join(", ")
                      : "sin armadura"
                  })`,
                },
                { key: "speed", title: "Velocidad", content: getSpeedString(npc.stats.speed) },
                {
                  key: "savingThrows",
                  title: "Tiradas de salvaci??n con competencia",
                  content: getSavingThrowString(npc),
                },
                {
                  key: "skills",
                  title: "Habilidades con competencia",
                  content: getAbilitiesString(npc),
                },
                {
                  key: "senses",
                  title: "Sentidos",
                  content: npc["stats"]["senses"].join(", "),
                },
                {
                  title: "Vulnerabilidades al da??o",
                  content: npc["stats"]["damageVulnerabilities"].join(", "),
                },
                {
                  key: "damageResistances",
                  title: "Resistencias al da??o",
                  content: npc["stats"]["damageResistances"].join(", "),
                },
                {
                  key: "damageImmunities",
                  title: "Inmunidades al da??o",
                  content: npc["stats"]["damageImmunities"].join(", "),
                },
                {
                  key: "conditionImmunities",
                  title: "Inmunidades a la condici??n",
                  content: npc["stats"]["conditionImmunities"].join(", "),
                },
                {
                  key: "challengeRating",
                  title: "Valor de desaf??o",
                  content: `${npc["stats"]["challengeRating"]} (${getExperienceByCr(
                    npc["stats"]["challengeRating"]
                  )} puntos de experiencia)`,
                },
              ],
              abilities: [
                { title: "Ataques", content: npc.stats.attacks ? getAttackStrings(npc) : [] },
                { title: "Acciones", content: npc["stats"]["actions"] },
                { title: "Reacciones", content: npc["stats"]["reactions"] },
                { title: "Habilidades", content: npc["stats"]["additionalAbilities"] },
                {
                  title: "Hechizos",
                  content:
                    npc.stats.spells?.length > 0 ? { characterSpells: npc.stats.spells, spellData: spells } : null,
                },
                { title: "Acciones legendarias", content: npc["stats"]["legendaryActions"] },
                { title: "Objetos", content: items },
              ],
            }}
          />
        </Grid>
      </Grid>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { req, query } = context;
  const secret = process.env.SECRET;

  const token = await getToken({ req, secret, raw: true }).catch((e) => console.error(e));

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    withCredentials: true,
  };

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const npc = await Api.fetchInternal("/npcs/" + query.id, {
    headers,
  }).catch((_) => null);

  if (!npc) return { notFound: true };

  let spells = null;
  let items = [];

  if (!!npc?.stats?.spells && npc.stats.spells.length > 0) {
    const spellIds = [];

    npc.stats.spells.forEach((spellcasting) => {
      Object.values(spellcasting.spells || {})?.forEach((spellLevel) => {
        spellIds.push(...spellLevel);
      });
    });

    spells = await Api.fetchInternal("/spells", {
      method: "POST",
      body: JSON.stringify(spellIds.map((spell) => spell.spellId)),
      headers,
    }).catch((_) => null);
  }

  if (!!npc?.stats?.equipment) {
    const objects = [];

    for (const key in npc.stats.equipment || {}) {
      const element = npc.stats.equipment[key];

      if (Array.isArray(element)) {
        objects.push(...element.map((i) => i.id));
      }
    }

    items = await Api.fetchInternal("/items", {
      method: "POST",
      body: JSON.stringify(objects),
    });

    items = items.map(({ _id, name, description }) => {
      return {
        id: _id,
        name,
        description,
      };
    });
  }

  let classes = await Api.fetchInternal("/classes/", {
    headers,
  }).catch(() => null);

  if (!!classes) {
    classes = classes.map((charClass) => {
      const parsed = {
        className: charClass.name,
        classId: charClass._id,
      };

      return parsed;
    });
  }

  return {
    props: {
      npc,
      spells,
      items,
      classes,
    },
  };
}
