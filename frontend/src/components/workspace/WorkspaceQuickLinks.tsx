import type { Messages } from "@/i18n/messages";
import styles from "@/app/works/[workId]/workspace.module.css";

interface WorkspaceQuickLinksProps {
  copy: Messages["workspace"];
}

const quickLinkIcons = ["♙", "□", "◇", "☷"];

export default function WorkspaceQuickLinks({
  copy,
}: WorkspaceQuickLinksProps) {
  const links = [
    copy.quickLinks.characters,
    copy.quickLinks.synopsis,
    copy.quickLinks.world,
    copy.quickLinks.episodes,
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
        {links.map((link, index) => (
          <button
            type="button"
            disabled
            title={copy.quickLinks.preparing}
            key={link.title}
          >
            <span aria-hidden="true">{quickLinkIcons[index]}</span>
            <span>
              <strong>{link.title}</strong>
              <small>{link.description}</small>
            </span>
            <i>{copy.quickLinks.preparing}</i>
          </button>
        ))}
      </div>
    </section>
  );
}
