import React, {useEffect, useState} from 'react';
import {Button, Modal, Progress, Icon} from 'semantic-ui-react';

import {H_RANDOM, useHash} from '../../hooks/useHash';
import {A_EXPORT, A_RESET, A_STOP, A_TICK, useAutomation} from '../../hooks/useAutomation';
import {useFeatures} from '../../hooks/useFeatures';

import {screenshot} from '../../helpers/screenshot';
import {exportCSV} from '../../helpers/csv';

const RunAutomation = () => {
    const [hash, hashAction] = useHash();
    const [automation, automationAction] = useAutomation();
    const [features] = useFeatures();

    const [featuresList, setFeaturesList] = useState([]);

    const msg_cap = 'Generating & Capturing Images';
    const msg_exp = 'Exporting CSV Features List';

    const [isSubmitting, setSubmitState] = useState(false);
    const [message, setMessage] = useState(msg_cap);

    const [runner, setRunner] = useState(null);

    useEffect(() => {
        if (automation.status === 'active' && runner === null) {
            setFeaturesList([]);
            hashAction({type: H_RANDOM});
            setRunner(
                setInterval(() => {
                    automationAction({
                        type: A_TICK,
                    });
                }, automation.waitTime),
            );
        }
    }, [automation.status]);

    useEffect(() => {
        if (automation.status === 'idle' && isSubmitting === true) {
            setSubmitState(false);
        }
    }, [automation.status]);

    useEffect(() => {
        if (automation.status === 'active') {
            if (automation.tick > 0 && automation.tick <= automation.total) {
                if (message !== msg_cap) setMessage(msg_cap);

                if (automation.doScreenshot) {
                    screenshot(hash.hash);
                }

                if (automation.doCSVExport) {
                    setTimeout(() => {
                        let f = features.data;
                        if (f !== undefined) {
                            f['hash'] = hash.hash;
                            f['edition'] = hash.number;
                            setFeaturesList(prev => [...prev, f]);
                        }
                    }, 900);
                }
            }

            if (automation.tick === automation.total) {
                automationAction({type: A_STOP});
            } else {
                hashAction({type: H_RANDOM});
            }
        }
    }, [automation.status, automation.tick]);

    useEffect(() => {
        if (automation.status === 'stopping') {
            clearInterval(runner);
            setRunner(null);

            if (automation.doCSVExport) {
                if (message !== msg_exp) setMessage(msg_exp);
                setTimeout(() => {
                    automationAction({type: A_EXPORT});
                }, automation.waitTime);
            } else {
                setTimeout(() => {
                    automationAction({type: A_RESET});
                }, 500);
            }
        }
    }, [automation.status]);

    useEffect(() => {
        if (automation.status === 'exporting') {
            exportCSV(featuresList);
            setTimeout(() => {
                automationAction({type: A_RESET});
            }, 500);
        }
    });

    return (
        <Modal size="tiny" open={automation.status === 'active' || automation.status === 'stopping' || automation.status === 'exporting'}>
            <Modal.Header>Running Automation</Modal.Header>
            <Modal.Content>
                <Progress percent={automation.progress} progress indicating>
                    {message}
                </Progress>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    negative
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    onClick={() => {
                        setSubmitState(true);
                        automationAction({type: A_STOP});
                    }}
                >
                    <Icon name="cancel" />
                    Stop
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

export default RunAutomation;
