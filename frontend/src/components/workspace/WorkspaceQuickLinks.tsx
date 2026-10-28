import Link from "next/link";
import type { Messages } from "@/i18n/messages";
import styles from "@/app/works/[workId]/workspace.module.css";

interface WorkspaceQuickLinksProps {
  copy: Messages["workspace"];
  workId: number;
}

const quickLinkIcons = ["♙", "□", "◇", "☷"] as const;

export default function WorkspaceQuickLinks({
  copy,
  workId,
}: WorkspaceQuickLinksProps) {
  const links = [
    {
      key: "characters",
      icon: quickLinkIcons[0],
      ...copy.quickLinks.characters,
    },
    {
      key: "synopsis",
      icon: quickLinkIcons[1],
      ...copy.quickLinks.synopsis,
    },
    {
      key: "world",
      icon: quickLinkIcons[2],
      ...copy.quickLinks.world,
    },
    {
      key: "episodes",
      icon: quickLinkIcons[3],
      ...copy.quickLinks.episodes,
    },
  ];

  return (
    <section className={styles.quickLinks}>
      <header>
        <h2>
          <span aria-hidden="true">◈</span>
          {copy.quickLinks.title}
        </h2>
      </header>
      <div>
        {links.map((link) => {
          const content = (
            <>
              <span aria-hidden="true">{link.icon}</span>
              <span>
                <strong>{link.title}</strong>
                <small>{link.description}</small>
              </span>
            </>
          );

          return link.key === "characters" ? (
            <Link
              className={styles.quickLinkCard}
              href={`/works/${workId}/characters`}
              key={link.key}
            >
              {content}
            </Link>
          ) : (
            <button
              className={styles.quickLinkCard}
              type="button"
              disabled
              title={copy.quickLinks.preparing}
              key={link.key}
            >
              {content}
              <i>{copy.quickLinks.preparing}</i>
            </button>
          );
        })}
      </div>
    </section>
  );
}
