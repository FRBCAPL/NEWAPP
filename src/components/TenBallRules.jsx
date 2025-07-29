import React, { useState } from 'react';
import styles from './TenBallRules.module.css';

const TenBallRules = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('basics');

  const ruleSections = {
    basics: {
      title: "Basic Rules",
      icon: "🎯",
      content: [
        {
          title: "Game Objective",
          text: "Ten Ball is a call shot game played with ten object balls numbered 1 through 10 and a cue ball. The player who legally pockets the 10-ball wins the game."
        },
        {
          title: "Equipment",
          text: "Standard pool table with six pockets, cue ball, object balls numbered 1-10, triangular rack, and cue sticks."
        },
        {
          title: "Players",
          text: "The game is played by two players or two teams taking alternating turns (called innings)."
        }
      ]
    },
    rack: {
      title: "Racking Rules",
      icon: "🔺",
      content: [
        {
          title: "Rack Formation",
          text: "Balls are racked in a triangle with the 1-ball at the apex on the foot spot, the 10-ball in the middle of the third row, and the 2-ball and 3-ball on the corners of the back row. Other balls are placed randomly."
        },
        {
          title: "Rack Placement",
          text: "The apex ball (1-ball) is placed on the foot spot. The rows behind the apex are parallel to the foot string."
        },
        {
          title: "Tight Rack",
          text: "Balls must be racked as tightly as possible with each ball touching all adjacent balls."
        }
      ]
    },
    break: {
      title: "Break Shot Rules",
      icon: "💥",
      content: [
        {
          title: "Break Requirements",
          text: "The cue ball begins behind the head string. The cue ball must contact the 1-ball before any other ball or cushion, or it's a foul. You must either legally pocket a ball or cause at least four object balls to contact one or more cushions."
        },
        {
          title: "Legal Break",
          text: "If you legally pocket a ball on the break, you continue shooting. The break is not a called shot."
        },
        {
          title: "10-Ball on Break",
          text: "If the 10-ball is legally pocketed on the break, it is spotted and the shooter continues their inning."
        },
        {
          title: "Jumped Balls",
          text: "Jumped object balls other than the 10-ball are not returned to the table. If the 10-ball is jumped, it is spotted."
        }
      ]
    },
    pushout: {
      title: "Push-Out Rule",
      icon: "⬆️",
      content: [
        {
          title: "When Available",
          text: "If there was no foul on the break, the player taking the first shot after the break has the option to shoot a push-out."
        },
        {
          title: "Push-Out Rules",
          text: "You must notify your opponent before the shot and they must acknowledge your intention. The cue ball is not required to contact the lowest numbered ball first, or any object ball at all. No ball is required to contact a cushion. All other rules and fouls still apply."
        },
        {
          title: "After Push-Out",
          text: "Any object balls except the 10-ball that are pocketed remain pocketed. If the 10-ball is pocketed, it is spotted. After a push-out without a foul, your opponent may accept the table in position and shoot, or require you to shoot again."
        }
      ]
    },
    gameplay: {
      title: "Continuing Play",
      icon: "🔄",
      content: [
        {
          title: "Ball Order",
          text: "You must contact the lowest numbered ball on the table first or it is a foul. This is the fundamental rule of ten ball."
        },
        {
          title: "Call Shot",
          text: "You must call the intended ball and pocket for every shot except the break and push-out. Only obvious shots may not require calling."
        },
        {
          title: "Continuing Inning",
          text: "You continue to shoot as long as you legally pocket a called ball on each shot. If the called ball is legally pocketed, other object balls pocketed remain pocketed (except the 10-ball, which is spotted)."
        },
        {
          title: "Turn Ends",
          text: "Your inning ends if you do not legally pocket a ball or commit a foul."
        }
      ]
    },
    fouls: {
      title: "Fouls & Penalties",
      icon: "⚠️",
      content: [
        {
          title: "Standard Fouls",
          text: "Cue ball scratch, wrong ball first, no rail after contact, no foot on floor, ball driven off table, touched ball, double hit, push shot, balls still moving, bad cue ball placement."
        },
        {
          title: "Foul Penalty",
          text: "After a foul, your opponent receives cue ball in hand anywhere on the table."
        },
        {
          title: "Successive Fouls",
          text: "Three successive fouls in one game results in loss of game. The opponent must warn the player when they are on two fouls."
        },
        {
          title: "Illegally Pocketed Balls",
          text: "A ball is illegally pocketed if: the called ball goes in other than the called pocket, or it's not the called ball and is pocketed when the called ball is not legally pocketed. If the 10-ball is illegally pocketed, it is spotted."
        }
      ]
    },
    winning: {
      title: "Winning the Game",
      icon: "🏆",
      content: [
        {
          title: "Game Winner",
          text: "The game is won by the player who legally pockets the 10-ball."
        },
        {
          title: "Legal 10-Ball",
          text: "The 10-ball must be pocketed on a legal shot where the cue ball first contacts the lowest numbered ball on the table, and the shot is properly called."
        },
        {
          title: "Early 10-Ball",
          text: "The 10-ball can be pocketed at any time during the game as long as the shot is legal (lowest ball contacted first) and properly called."
        },
        {
          title: "Opponent's Option",
          text: "If you illegally pocket any ball, your opponent has the option to accept the table in position or require you to shoot again."
        }
      ]
    },
    strategy: {
      title: "Strategy & Tips",
      icon: "🧠",
      content: [
        {
          title: "Position Play",
          text: "Focus on leaving yourself in good position for the next shot. Control of the cue ball is crucial in ten ball."
        },
        {
          title: "Safety Play",
          text: "When you don't have a good shot, play a safety to leave your opponent in a difficult position. You may call 'safety' which permits contact with the legal object ball without pocketing a ball."
        },
        {
          title: "Planning Ahead",
          text: "Think several balls ahead. Plan your route through the remaining balls to give yourself the best chance at the 10-ball."
        },
        {
          title: "Break Strategy",
          text: "A good break is important for controlling the table. Aim for the 1-ball with enough speed to spread the balls while maintaining control."
        },
        {
          title: "Call Shot Strategy",
          text: "When in doubt, call your shot clearly. Communication prevents disputes and shows good sportsmanship."
        }
      ]
    }
  };

  const sectionKeys = Object.keys(ruleSections);

  return (
    <div className={styles.rulesOverlay}>
      <div className={styles.rulesModal}>
        <div className={styles.rulesHeader}>
          <h2>Official Ten Ball Rules</h2>
          <p>Based on CueSports International Official Rules</p>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.rulesContent}>
          <div className={styles.sidebar}>
            <h3>Sections</h3>
            <nav className={styles.sectionNav}>
              {sectionKeys.map(key => (
                <button
                  key={key}
                  className={`${styles.navButton} ${activeSection === key ? styles.active : ''}`}
                  onClick={() => setActiveSection(key)}
                >
                  <span className={styles.navIcon}>{ruleSections[key].icon}</span>
                  <span className={styles.navText}>{ruleSections[key].title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className={styles.mainContent}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{ruleSections[activeSection].icon}</span>
              <h3>{ruleSections[activeSection].title}</h3>
            </div>

            <div className={styles.sectionContent}>
              {ruleSections[activeSection].content.map((item, index) => (
                <div key={index} className={styles.ruleItem}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rulesFooter}>
          <div className={styles.footerNote}>
            <p><strong>Note:</strong> These rules are based on the official CueSports International rulebook. 
            For complete rules and interpretations, refer to the official CSI documentation.</p>
          </div>
          
          <div className={styles.footerActions}>
            <button 
              className={styles.printButton}
              onClick={() => window.print()}
            >
              🖨️ Print Rules
            </button>
            <button 
              className={styles.primaryButton}
              onClick={onClose}
            >
              Got It! Let's Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenBallRules;